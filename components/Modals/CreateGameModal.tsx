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

  const [gameMasters, setGameMasters] = useState<string>('');
  const [daoAddress, setDaoAddress] = useState<string>('');
  // const [defaultCharacterImage, setDefaultCharacterImage] =
  //   useState<File | null>(null);

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
    return invalidGameMasterAddress || invalidDaoAddress || !gameMasters;
  }, [gameMasters, invalidGameMasterAddress, invalidDaoAddress]);

  useEffect(() => {
    setShowError(false);
  }, [daoAddress, gameMasters]);

  const resetData = useCallback(() => {
    setGameMasters(address ?? '');
    setDaoAddress(NEXT_PUBLIC_DEFAULT_DAO_ADDRESS ?? '');
    // setDefaultCharacterImage(null);
    setShowError(false);
  }, [address]);

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
    [daoAddress, gameMasters, hasError, toast, write],
  );

  const isLoading = isContractWriteLoading || isWaitForTxLoading;

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
            <VStack as="form" mt={10} onSubmit={onCreateGame} spacing={8}>
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
              {/* <FormControl>
              <Flex align="center">
                <FormLabel>Default Character Avatar (optional)</FormLabel>
                <Tooltip label="The default character avatar is the image that will render for a character who does not have a class. If you do not provide a default character avatar, we will provide one for you.">
                  <Image
                    alt="down arrow"
                    height="14px"
                    mb={2}
                    src="/question-mark.svg"
                    width="14px"
                  />
                </Tooltip>
              </Flex>
              <Input type="file" variant="file" />
            </FormControl> */}
              <Button
                alignSelf="flex-end"
                isDisabled={isLoading}
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
