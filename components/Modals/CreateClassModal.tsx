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
  useToast,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { encodeAbiParameters, parseAbi } from 'viem';
import { Address, usePublicClient, useWalletClient } from 'wagmi';

import { TransactionPending } from '@/components/TransactionPending';
import { useGame } from '@/contexts/GameContext';
import { waitUntilBlock } from '@/hooks/useGraphHealth';
import { useUploadFile } from '@/hooks/useUploadFile';

type CreateClassModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const CreateClassModal: React.FC<CreateClassModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const toast = useToast();

  const { game, reload: reloadGame } = useGame();

  const {
    file: classEmblem,
    setFile: setClassEmblem,
    onRemove,
    onUpload,
    isUploading,
    isUploaded,
  } = useUploadFile({ fileName: 'classEmblem' });

  const [className, setClassName] = useState<string>('');
  const [classDescription, setClassDescription] = useState<string>('');

  const [showError, setShowError] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSynced, setIsSynced] = useState<boolean>(false);

  const invalidClassDescription = useMemo(() => {
    return classDescription.length > 200 && !!classDescription;
  }, [classDescription]);

  const hasError = useMemo(() => {
    return (
      !classDescription || !classEmblem || !className || invalidClassDescription
    );
  }, [classDescription, classEmblem, className, invalidClassDescription]);

  const resetData = useCallback(() => {
    setClassName('');
    setClassDescription('');
    setClassEmblem(null);

    setShowError(false);

    setIsCreating(false);
    setTxHash(null);
    setIsSyncing(false);
    setIsSynced(false);
  }, [setClassEmblem]);

  useEffect(() => {
    if (!isOpen) {
      resetData();
    }
  }, [resetData, isOpen]);

  const onCreateClass = useCallback(
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

      if (!game?.classesAddress) {
        toast({
          description: `Could not find a class factory for the ${walletClient.chain.name} network.`,
          position: 'top',
          status: 'error',
        });
        console.error(
          `Missing class factory address for the ${walletClient.chain.name} network"`,
        );
        return;
      }

      const cid = await onUpload();

      if (!cid) {
        toast({
          description: 'Something went wrong uploading your class emblem.',
          position: 'top',
          status: 'error',
        });
        return;
      }

      const classMetadata = {
        name: className,
        description: classDescription,
        image: `ipfs://${cid}`,
      };

      setIsCreating(true);

      try {
        const res = await fetch('/api/uploadMetadata?name=classMetadata.json', {
          method: 'POST',
          body: JSON.stringify(classMetadata),
        });

        if (!res.ok) {
          toast({
            description: 'Something went wrong uploading your class metadata.',
            position: 'top',
            status: 'error',
          });
          return;
        }

        const { cid: classMetadataCid } = await res.json();

        if (!classMetadataCid) {
          toast({
            description: 'Something went wrong uploading your class metadata.',
            position: 'top',
            status: 'error',
          });
          return;
        }

        const encodedClassCreationData = encodeAbiParameters(
          [
            {
              name: 'name',
              type: 'string',
            },
            {
              name: 'classesUri',
              type: 'string',
            },
          ],
          [className, classMetadataCid],
        );

        const transactionhash = await walletClient.writeContract({
          chain: walletClient.chain,
          account: walletClient.account?.address as Address,
          address: game.classesAddress as Address,
          abi: parseAbi([
            'function createClassType(bytes calldata classData) external returns (uint256)',
          ]),
          functionName: 'createClassType',
          args: [encodedClassCreationData],
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
        toast({
          description: `Your class was successfully created!`,
          position: 'top',
          status: 'success',
        });
        setIsSynced(true);
        reloadGame();
      } catch (e) {
        toast({
          description: 'Something went wrong creating your class.',
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
      game,
      classDescription,
      reloadGame,
      className,
      hasError,
      onUpload,
      publicClient,
      toast,
      walletClient,
    ],
  );

  const isLoading = isCreating;
  const isDisabled = isLoading || isUploading;

  const content = () => {
    // TODO: This isSynced check is unnecessary since the modal unmounts when the data is reloaded
    // We should move all action modals to a higher level component to avoid this
    if (isSynced) {
      return (
        <VStack py={10} spacing={4}>
          <Text>Your class was successfully created!</Text>
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
          text="Your class is being created."
          txHash={txHash}
        />
      );
    }

    return (
      <VStack as="form" onSubmit={onCreateClass} spacing={8}>
        <FormControl isInvalid={showError && !className}>
          <FormLabel>Class Name</FormLabel>
          <Input
            onChange={e => setClassName(e.target.value)}
            type="text"
            value={className}
          />
          {showError && !className && (
            <FormHelperText color="red">
              A class name is required
            </FormHelperText>
          )}
        </FormControl>
        <FormControl isInvalid={showError && !classDescription}>
          <FormLabel>Class Description (200 character limit)</FormLabel>
          <Textarea
            onChange={e => setClassDescription(e.target.value)}
            value={classDescription}
          />
          {showError && !classDescription && (
            <FormHelperText color="red">
              A class description is required
            </FormHelperText>
          )}
          {showError && invalidClassDescription && (
            <FormHelperText color="red">
              Class description must be less than 200 characters
            </FormHelperText>
          )}
        </FormControl>
        <FormControl isInvalid={showError && !classEmblem}>
          <FormLabel>Class Emblem</FormLabel>
          {!classEmblem && (
            <Input
              accept=".png, .jpg, .jpeg, .svg"
              disabled={isUploading}
              onChange={e => setClassEmblem(e.target.files?.[0] ?? null)}
              type="file"
              variant="file"
            />
          )}
          {classEmblem && (
            <Flex align="center" gap={10} mt={4}>
              <Image
                alt="class emblem"
                objectFit="contain"
                src={URL.createObjectURL(classEmblem)}
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
          {showError && !classEmblem && (
            <FormHelperText color="red">
              A class emblem is required
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
          <Text>Create a Class</Text>
          <ModalCloseButton size="lg" />
        </ModalHeader>
        <ModalBody>{content()}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
