import {
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  Textarea,
  Tooltip,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { encodeAbiParameters, isAddress, parseAbi } from 'viem';
import { Address, useAccount, usePublicClient, useWalletClient } from 'wagmi';

import { TransactionPending } from '@/components/TransactionPending';
import { useGlobal } from '@/hooks/useGlobal';
import { waitUntilBlock } from '@/hooks/useGraphHealth';
import { useUploadFile } from '@/hooks/useUploadFile';
import { DEFAULT_CHAIN } from '@/lib/web3';
import { DEFAULT_DAO_ADDRESSES } from '@/utils/constants';

type CreateGameModalProps = {
  reloadGames: () => void;
  isOpen: boolean;
  onClose: () => void;
};

const DEFAULT_DAO_ADDRESS = DEFAULT_DAO_ADDRESSES[DEFAULT_CHAIN.id];

export const CreateGameModal: React.FC<CreateGameModalProps> = ({
  reloadGames,
  isOpen,
  onClose,
}) => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { gameFactory } = useGlobal(
    walletClient?.chain?.name?.toLowerCase() ?? '',
  );
  const toast = useToast();

  const {
    file: gameEmblem,
    setFile: setGameEmblem,
    onRemove,
    onUpload,
    isUploading,
    isUploaded,
  } = useUploadFile({ fileName: 'gameEmblem' });
  const [gameName, setGameName] = useState<string>('');
  const [gameDescription, setGameDescription] = useState<string>('');
  const [gameMasters, setGameMasters] = useState<string>('');
  const [daoAddress, setDaoAddress] = useState<string>('');

  const [showError, setShowError] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSynced, setIsSynced] = useState<boolean>(false);

  const invalidGameDescription = useMemo(() => {
    return gameDescription.length > 200 && !!gameDescription;
  }, [gameDescription]);

  const invalidGameMasterAddress = useMemo(() => {
    const addresses = gameMasters.split(',');
    const trimmedAddresses = addresses.map(address => address.trim());
    return (
      trimmedAddresses.some(address => !isAddress(address)) && !!gameMasters
    );
  }, [gameMasters]);

  const invalidDaoAddress = useMemo(() => {
    return !isAddress(daoAddress) && !!daoAddress;
  }, [daoAddress]);

  const hasError = useMemo(() => {
    return (
      !gameDescription ||
      !gameEmblem ||
      !gameMasters ||
      !gameName ||
      invalidDaoAddress ||
      invalidGameDescription ||
      invalidGameMasterAddress
    );
  }, [
    gameDescription,
    gameEmblem,
    gameMasters,
    gameName,
    invalidDaoAddress,
    invalidGameDescription,
    invalidGameMasterAddress,
  ]);

  useEffect(() => {
    setShowError(false);
  }, [daoAddress, gameMasters]);

  const resetData = useCallback(() => {
    setGameName('');
    setGameDescription('');
    setGameEmblem(null);
    setGameMasters(address ?? '');
    setDaoAddress(DEFAULT_DAO_ADDRESS ?? '');
    setShowError(false);

    setIsCreating(false);
    setTxHash(null);
    setIsSyncing(false);
    setIsSynced(false);
  }, [address, setGameEmblem]);

  useEffect(() => {
    if (!isOpen) {
      resetData();
    }
  }, [resetData, isOpen]);

  const onCreateGame = useCallback(
    async (e: React.FormEvent<HTMLDivElement>) => {
      e.preventDefault();

      if (hasError) {
        setShowError(true);
        return;
      }

      if (!walletClient) {
        toast({
          description: 'Wallet client is not connected.',
          position: 'top',
          status: 'error',
        });
        console.error('Could not find a wallet client.');
        return;
      }

      if (!DEFAULT_DAO_ADDRESS) {
        toast({
          description: `DEFAULT_DAO_ADDRESS not configured for the chain ${walletClient.chain.name}.`,
          position: 'top',
          status: 'error',
        });
        console.error(
          `DEFAULT_DAO_ADDRESS not configured for the chain ${walletClient.chain.name}.`,
        );
        return;
      }

      if (!gameFactory) {
        toast({
          description: `Could not find a game factory for the ${walletClient.chain.name} network.`,
          position: 'top',
          status: 'error',
        });
        console.error(
          `Missing game factory address for the ${walletClient.chain.name} network"`,
        );
        return;
      }

      const trimmedGameMasterAddresses = gameMasters
        .split(',')
        .map(address => address.trim()) as Address[];

      const trimmedDaoAddress =
        (daoAddress.trim() as Address) || DEFAULT_DAO_ADDRESS;

      const cid = await onUpload();

      if (!cid) {
        toast({
          description: 'Something went wrong uploading your game emblem.',
          position: 'top',
          status: 'error',
        });
        return;
      }

      const gameMetadata = {
        name: gameName,
        description: gameDescription,
        image: `ipfs://${cid}`,
      };

      setIsCreating(true);

      try {
        const res = await fetch('/api/uploadMetadata?name=gameMetadata.json', {
          method: 'POST',
          body: JSON.stringify(gameMetadata),
        });

        if (!res.ok) {
          toast({
            description: 'Something went wrong uploading your game metadata.',
            position: 'top',
            status: 'error',
          });
          return;
        }

        const { cid: gameMetadataCid } = await res.json();

        if (!gameMetadataCid) {
          toast({
            description: 'Something went wrong uploading your game metadata.',
            position: 'top',
            status: 'error',
          });
          return;
        }

        const encodedGameCreationData = encodeAbiParameters(
          [
            {
              name: 'characterSheetsMetadataUri',
              type: 'string',
            },
            {
              name: 'characterSheetsBaseUri',
              type: 'string',
            },
            {
              name: 'experienceBaseUri',
              type: 'string',
            },
            {
              name: 'classesBaseUri',
              type: 'string',
            },
          ],
          [`ipfs://${gameMetadataCid}`, 'ipfs://', 'ipfs://', 'ipfs://'],
        );

        const transactionhash = await walletClient.writeContract({
          chain: walletClient.chain,
          account: walletClient.account?.address as Address,
          address: gameFactory as Address,
          abi: parseAbi([
            'function create(address[], address, bytes calldata) external returns (address, address, address)',
          ]),
          functionName: 'create',
          args: [
            trimmedGameMasterAddresses,
            trimmedDaoAddress,
            encodedGameCreationData,
          ],
        });
        setTxHash(transactionhash);

        const client = publicClient ?? walletClient;
        const receipt = await client.waitForTransactionReceipt({
          hash: transactionhash,
        });

        setIsSyncing(true);
        const synced = await waitUntilBlock(receipt.blockNumber);

        if (!synced) {
          toast({
            description: 'Something went wrong while syncing.',
            position: 'top',
            status: 'warning',
          });
          return;
        }
        setIsSynced(true);
        reloadGames();
      } catch (e) {
        toast({
          description: 'Something went wrong creating your game.',
          position: 'top',
          status: 'error',
        });
        console.error(e);
      } finally {
        setIsSyncing(false);
        setIsCreating(false);
      }
    },
    [
      daoAddress,
      gameDescription,
      gameFactory,
      gameMasters,
      gameName,
      hasError,
      onUpload,
      publicClient,
      reloadGames,
      toast,
      walletClient,
    ],
  );

  const isLoading = isCreating;
  const isDisabled = isLoading || isUploading;

  const content = () => {
    if (isSynced) {
      return (
        <VStack py={10} spacing={4}>
          <Text>Your game was successfully created!</Text>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

    if (txHash) {
      return (
        <TransactionPending
          isSyncing={isSyncing}
          text="Your game is being created."
          txHash={txHash}
        />
      );
    }

    return (
      <VStack as="form" onSubmit={onCreateGame} spacing={8}>
        <FormControl isInvalid={showError && !gameName}>
          <FormLabel>Game Name</FormLabel>
          <Input
            onChange={e => setGameName(e.target.value)}
            type="text"
            value={gameName}
          />
          {showError && !gameName && (
            <FormHelperText color="red">A game name is required</FormHelperText>
          )}
        </FormControl>
        <FormControl isInvalid={showError && !gameDescription}>
          <FormLabel>Game Description (200 character limit)</FormLabel>
          <Textarea
            onChange={e => setGameDescription(e.target.value)}
            value={gameDescription}
          />
          {showError && !gameDescription && (
            <FormHelperText color="red">
              A game description is required
            </FormHelperText>
          )}
          {showError && invalidGameDescription && (
            <FormHelperText color="red">
              Game description must be less than 200 characters
            </FormHelperText>
          )}
        </FormControl>
        <FormControl isInvalid={showError && !gameEmblem}>
          <FormLabel>Game Emblem</FormLabel>
          {!gameEmblem && (
            <Input
              accept=".png, .jpg, .jpeg, .svg"
              disabled={isUploading}
              onChange={e => setGameEmblem(e.target.files?.[0] ?? null)}
              type="file"
              variant="file"
            />
          )}
          {gameEmblem && (
            <Flex align="center" gap={10} mt={4}>
              <Image
                alt="game emblem"
                objectFit="contain"
                src={URL.createObjectURL(gameEmblem)}
                w="300px"
              />
              <Button
                isDisabled={isUploading || isUploaded}
                isLoading={isUploading}
                loadingText="Uploading..."
                mt={4}
                onClick={!isUploaded ? onRemove : undefined}
                type="button"
                variant="outline"
              >
                {isUploaded ? 'Uploaded' : 'Remove'}
              </Button>
            </Flex>
          )}
          {showError && !gameEmblem && (
            <FormHelperText color="red">
              A game emblem is required
            </FormHelperText>
          )}
        </FormControl>
        <FormControl
          isInvalid={showError && (invalidGameMasterAddress || !gameMasters)}
        >
          <Flex align="center">
            <FormLabel>GameMasters (separate addresses by commas)</FormLabel>
            <Tooltip label="GameMasters act as admins for the entire game. They can do things like change settings, create classes, and create items.">
              <Image
                alt="down arrow"
                height="14px"
                mb={2}
                src="/question-mark.svg"
                width="14px"
              />
            </Tooltip>
          </Flex>
          <Input
            onChange={e => setGameMasters(e.target.value)}
            type="text"
            value={gameMasters}
          />
          {showError && !gameMasters && (
            <FormHelperText color="red">
              A GameMaster address is required
            </FormHelperText>
          )}
          {showError && invalidGameMasterAddress && (
            <FormHelperText color="red">
              Invalid GameMaster address
            </FormHelperText>
          )}
        </FormControl>
        <FormControl isInvalid={showError && invalidDaoAddress}>
          <Flex align="center">
            <FormLabel>DAO Address (optional)</FormLabel>
            <Tooltip label="By adding a DAO address, you restrict who can create characters to only members of that DAO. If you do not provide a DAO address, anyone can create a character by joining an open DAO that we provide.">
              <Image
                alt="down arrow"
                height="14px"
                mb={2}
                src="/question-mark.svg"
                width="14px"
              />
            </Tooltip>
          </Flex>
          <Input
            onChange={e => setDaoAddress(e.target.value)}
            type="text"
            value={daoAddress}
          />
          {showError && invalidDaoAddress && (
            <FormHelperText color="red">Invalid DAO address</FormHelperText>
          )}
        </FormControl>
        <Button
          alignSelf="flex-end"
          isDisabled={isDisabled}
          isLoading={isLoading}
          loadingText="Creating..."
          type="submit"
        >
          Create
        </Button>
      </VStack>
    );
  };

  return (
    <Modal
      closeOnEsc={!isLoading}
      closeOnOverlayClick={!isLoading}
      isOpen={isOpen}
      onClose={onClose}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Text>Create a Game</Text>
          <ModalCloseButton size="lg" />
        </ModalHeader>
        <ModalBody>{content()}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
