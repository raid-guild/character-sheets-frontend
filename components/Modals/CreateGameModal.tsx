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
  VStack,
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { encodeAbiParameters, isAddress, parseAbi, zeroAddress } from 'viem';
import { Address, useAccount, usePublicClient, useWalletClient } from 'wagmi';

import { TransactionPending } from '@/components/TransactionPending';
import { useGamesContext } from '@/contexts/GamesContext';
import { useGlobal } from '@/hooks/useGlobal';
import { waitUntilBlock } from '@/hooks/useGraphHealth';
import { useToast } from '@/hooks/useToast';
import { useUploadFile } from '@/hooks/useUploadFile';

export const CreateGameModal: React.FC = () => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { gameFactory } = useGlobal(
    walletClient?.chain?.name?.toLowerCase() ?? '',
  );
  const { renderError } = useToast();
  const { createGameModal: { isOpen, onClose } = {}, reload: reloadGames } =
    useGamesContext();

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
  const [txFailed, setTxFailed] = useState<boolean>(false);
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
    setDaoAddress('');
    setShowError(false);

    setIsCreating(false);
    setTxHash(null);
    setTxFailed(false);
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

      try {
        if (!walletClient) throw new Error('Could not find a wallet client');
        if (!gameFactory)
          throw new Error(
            `Missing game factory address for the ${walletClient.chain.name} network`,
          );

        const trimmedGameMasterAddresses = gameMasters
          .split(',')
          .map(address => address.trim()) as Address[];

        const trimmedDaoAddress = (daoAddress.trim() as Address) || zeroAddress;

        const cid = await onUpload();
        if (!cid)
          throw new Error('Something went wrong uploading your game emblem');

        const gameMetadata = {
          name: gameName,
          description: gameDescription,
          image: `ipfs://${cid}`,
        };

        setIsCreating(true);

        const res = await fetch('/api/uploadMetadata?name=gameMetadata.json', {
          method: 'POST',
          body: JSON.stringify(gameMetadata),
        });
        if (!res.ok)
          throw new Error('Something went wrong uploading your game metadata');

        const { cid: gameMetadataCid } = await res.json();
        if (!gameMetadataCid)
          throw new Error('Something went wrong uploading your game metadata');

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

        const encodedHatsData = encodeAbiParameters(
          [
            {
              name: 'hatsImgUri',
              type: 'string',
            },
            { name: 'topHatDescription', type: 'string' },
            {
              name: 'adminHatUri',
              type: 'string',
            },
            {
              name: 'adminHatDescription',
              type: 'string',
            },
            {
              name: 'gameHatUri',
              type: 'string',
            },
            {
              name: 'gameHatDescription',
              type: 'string',
            },
            {
              name: 'playerHatUri',
              type: 'string',
            },
            {
              name: 'playerHatDescription',
              type: 'string',
            },
            {
              name: 'characterHatUri',
              type: 'string',
            },
            {
              name: 'characterHatDescription',
              type: 'string',
            },
          ],
          [
            gameMetadata.image,
            'Top Hat',
            'ipfs://',
            'Admin Hat',
            'ipfs://',
            'Game Hat',
            'ipfs://',
            'Player Hat',
            'ipfs://',
            'Character Hat',
          ],
        );

        const adminAddresses = [walletClient.account?.address as Address];

        const transactionhash = await walletClient.writeContract({
          chain: walletClient.chain,
          account: walletClient.account?.address as Address,
          address: gameFactory as Address,
          abi: parseAbi([
            'function createAndInitialize(address dao,address[] calldata admins,address[] calldata dungeonMasters,bytes calldata encodedHatsStrings,bytes calldata sheetsStrings) public returns (address)',
          ]),
          functionName: 'createAndInitialize',
          args: [
            trimmedDaoAddress,
            adminAddresses,
            trimmedGameMasterAddresses,
            encodedHatsData,
            encodedGameCreationData,
          ],
        });
        setTxHash(transactionhash);

        const client = publicClient ?? walletClient;
        const { blockNumber, status } = await client.waitForTransactionReceipt({
          hash: transactionhash,
        });

        if (status === 'reverted') {
          setTxFailed(true);
          setIsCreating(false);
          throw new Error('Transaction failed');
        }

        setIsSyncing(true);
        const synced = await waitUntilBlock(blockNumber);
        if (!synced) throw new Error('Something went wrong while syncing');

        setIsSynced(true);
        reloadGames();
      } catch (e) {
        renderError(e, 'Something went wrong creating your game');
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
      renderError,
      walletClient,
    ],
  );

  const isLoading = isCreating;
  const isDisabled = isLoading || isUploading;

  const content = () => {
    if (txFailed) {
      return (
        <VStack py={10} spacing={4}>
          <Text>Transaction failed.</Text>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

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
                src="/icons/question-mark.svg"
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
            <Tooltip label="By adding a DAO address, you restrict who can create characters to only members of that DAO. If you do not provide a DAO address, anyone can create a character.">
              <Image
                alt="down arrow"
                height="14px"
                mb={2}
                src="/icons/question-mark.svg"
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
      isOpen={isOpen ?? false}
      onClose={onClose ?? (() => undefined)}
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
