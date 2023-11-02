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
  VStack,
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { encodeAbiParameters, parseAbi } from 'viem';
import { Address, usePublicClient, useWalletClient } from 'wagmi';

import { Switch } from '@/components/Switch';
import { TransactionPending } from '@/components/TransactionPending';
import { useGame } from '@/contexts/GameContext';
import { waitUntilBlock } from '@/hooks/useGraphHealth';
import { useToast } from '@/hooks/useToast';
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
  const { renderError } = useToast();

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
  const [isClaimable, setIsClaimable] = useState<boolean>(false);

  const [showError, setShowError] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txFailed, setTxFailed] = useState<boolean>(false);
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
    setIsClaimable(false);
    setClassEmblem(null);

    setShowError(false);

    setIsCreating(false);
    setTxHash(null);
    setTxFailed(false);
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

      try {
        if (!walletClient) throw new Error('Could not find a wallet client');

        if (!game?.classesAddress)
          throw new Error(
            `Missing class factory address for the ${walletClient.chain.name} network`,
          );

        const cid = await onUpload();
        if (!cid)
          throw new Error('Something went wrong uploading your class emblem');

        const classMetadata = {
          name: className,
          description: classDescription,
          image: `ipfs://${cid}`,
        };

        setIsCreating(true);

        const res = await fetch('/api/uploadMetadata?name=classMetadata.json', {
          method: 'POST',
          body: JSON.stringify(classMetadata),
        });
        if (!res.ok)
          throw new Error('Something went wrong uploading your class metadata');

        const { cid: classMetadataCid } = await res.json();
        if (!classMetadataCid)
          throw new Error('Something went wrong uploading your class metadata');

        const encodedClassCreationData = encodeAbiParameters(
          [
            {
              name: 'claimable',
              type: 'bool',
            },
            {
              name: 'classesUri',
              type: 'string',
            },
          ],
          [isClaimable, classMetadataCid],
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
        reloadGame();
      } catch (e) {
        renderError(e, 'Something went wrong creating your class');
      } finally {
        setIsSyncing(false);
        setIsCreating(false);
      }
    },
    [
      classDescription,
      className,
      game,
      hasError,
      isClaimable,
      onUpload,
      publicClient,
      reloadGame,
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
        <FormControl>
          <FormLabel>Allow any character to claim this class?</FormLabel>
          <Switch
            isChecked={isClaimable}
            onChange={() => setIsClaimable(!isClaimable)}
          />
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
