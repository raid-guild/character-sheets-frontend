import {
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Image,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  Tooltip,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { encodeAbiParameters, Hex, isAddress, parseAbi } from 'viem';
import {
  Address,
  useAccount,
  useContractWrite,
  useNetwork,
  useWaitForTransaction,
} from 'wagmi';

import { useUploadFile } from '@/hooks/useUploadFile';
import { EXPLORER_URLS } from '@/utils/constants';

const NEXT_PUBLIC_FACTORY_ADDRESS = process.env
  .NEXT_PUBLIC_FACTORY_ADDRESS as Address;
const NEXT_PUBLIC_DEFAULT_DAO_ADDRESS = process.env
  .NEXT_PUBLIC_DEFAULT_DAO_ADDRESS as Address;

type CreateGameModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const CreateGameModal: React.FC<CreateGameModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { address } = useAccount();
  const toast = useToast();

  const {
    data,
    isLoading: isContractWriteLoading,
    isSuccess: isContractWriteSuccess,
    write,
    reset,
  } = useContractWrite({
    address: NEXT_PUBLIC_FACTORY_ADDRESS ?? '0x',
    abi: parseAbi([
      'function create(address[], address, bytes calldata) external returns (address, address, address)',
    ]),
    functionName: 'create',
  });
  const {
    isError,
    isLoading: isWaitForTxLoading,
    isSuccess,
    error,
  } = useWaitForTransaction({
    hash: data?.hash,
  });

  const {
    file: gameEmblem,
    setFile: setGameEmblem,
    onRemove,
    onUpload,
    isUploading,
    isUploaded,
  } = useUploadFile();

  const [gameName, setGameName] = useState<string>('');
  const [gameMasters, setGameMasters] = useState<string>('');
  const [daoAddress, setDaoAddress] = useState<string>('');

  const [showError, setShowError] = useState<boolean>(false);

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
      invalidGameMasterAddress ||
      invalidDaoAddress ||
      !gameName ||
      !gameEmblem ||
      !gameMasters
    );
  }, [
    gameEmblem,
    gameMasters,
    gameName,
    invalidDaoAddress,
    invalidGameMasterAddress,
  ]);

  useEffect(() => {
    setShowError(false);
  }, [daoAddress, gameMasters]);

  const resetData = useCallback(() => {
    setGameName('');
    setGameEmblem(null);
    setGameMasters(address ?? '');
    setDaoAddress(NEXT_PUBLIC_DEFAULT_DAO_ADDRESS ?? '');
    setShowError(false);
  }, [address, setGameEmblem]);

  useEffect(() => {
    if (!isOpen) {
      resetData();
      reset();
    }
  }, [reset, resetData, isOpen]);

  const onCreateGame = useCallback(
    async (e: React.FormEvent<HTMLDivElement>) => {
      e.preventDefault();

      if (hasError) {
        setShowError(true);
        return;
      }

      if (!(NEXT_PUBLIC_DEFAULT_DAO_ADDRESS && NEXT_PUBLIC_FACTORY_ADDRESS)) {
        toast({
          description: 'App is missing required environment variables.',
          position: 'top',
          status: 'error',
        });
        console.error(
          `Invalid/Missing environment variables: "NEXT_PUBLIC_DEFAULT_DAO_ADDRESS" or "NEXT_PUBLIC_FACTORY_ADDRESS"`,
        );
        return;
      }

      const trimmedGameMasterAddresses = gameMasters
        .split(',')
        .map(address => address.trim()) as Address[];

      const trimmedDaoAddress =
        (daoAddress.trim() as Address) || NEXT_PUBLIC_DEFAULT_DAO_ADDRESS;

      const url = await onUpload();

      if (!url) {
        toast({
          description: 'Something went wrong uploading your game emblem.',
          position: 'top',
          status: 'error',
        });
        return;
      }

      const encodedGameCreationData = encodeAbiParameters(
        [
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
        [
          'https://ipfs.io/ipfs/bafybeiewjp7fbvohjtnn5bahiny66obdlh37l4bdln3xmnguoyfshyi5lq/characterSheetsBaseUri.json',
          'https://ipfs.io/ipfs/bafybeigyaix6wunsrqzna66y62i4egqhj327dnejb4esyrk7gce5txfcna/experienceBaseUri.json',
          'https://ipfs.io/ipfs/bafybeian3cmjldnwaok7iw72ttfuniesptu3dsuepptwmq3u2y35rqh4bu/classesBaseUri.json',
        ],
      );

      write({
        args: [
          trimmedGameMasterAddresses,
          trimmedDaoAddress,
          encodedGameCreationData,
        ],
      });
    },
    [daoAddress, gameMasters, hasError, onUpload, toast, write],
  );

  const isLoading = isContractWriteLoading || isWaitForTxLoading;
  const isDisabled = isLoading || isUploading;

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
        <ModalBody>
          {isLoading && data && isContractWriteSuccess ? (
            <TransactionPending data={data} />
          ) : isSuccess || isError ? (
            isSuccess ? (
              <VStack py={10} spacing={4}>
                <Text>Your game was successfully created!</Text>
                <Button onClick={onClose} variant="outline">
                  Close
                </Button>
              </VStack>
            ) : (
              <VStack py={10} spacing={4}>
                <Text>Something went wrong.</Text>
                <Text>{(error?.cause as { details: string })?.details}</Text>
              </VStack>
            )
          ) : (
            <VStack as="form" onSubmit={onCreateGame} spacing={8}>
              <FormControl isInvalid={showError && !gameName}>
                <FormLabel>Game Name</FormLabel>
                <Input
                  onChange={e => setGameName(e.target.value)}
                  type="text"
                  value={gameName}
                />
                {showError && !gameName && (
                  <FormHelperText color="red">
                    A game name is required
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
                isInvalid={
                  showError && (invalidGameMasterAddress || !gameMasters)
                }
              >
                <Flex align="center">
                  <FormLabel>
                    GameMasters (separate addresses by commas)
                  </FormLabel>
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
                  <FormHelperText color="red">
                    Invalid DAO address
                  </FormHelperText>
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
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

type TransactionPendingProps = {
  data: {
    hash: Hex;
  };
};

const TransactionPending: React.FC<TransactionPendingProps> = ({ data }) => {
  const { hash } = data;
  const { chain } = useNetwork();

  return (
    <VStack py={10} spacing={4}>
      <Text>Your game is being created...</Text>
      {EXPLORER_URLS[chain?.id ?? 0] && (
        <Text>
          Click{' '}
          <Link
            borderBottom="2px solid black"
            href={`${EXPLORER_URLS[chain?.id ?? 0]}/tx/${hash}`}
            isExternal
          >
            here
          </Link>{' '}
          to view your transaction.
        </Text>
      )}
    </VStack>
  );
};
