import {
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Image,
  Input,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useMemo, useState } from 'react';
import { encodeAbiParameters, parseAbi } from 'viem';
import { Address, useWalletClient } from 'wagmi';

import { Switch } from '@/components/Switch';
import { useGameActions } from '@/contexts/GameActionsContext';
import { useGame } from '@/contexts/GameContext';
import { useCharacterLimitMessage } from '@/hooks/useCharacterLimitMessage';
import { useUploadFile } from '@/hooks/useUploadFile';

import { ActionModal } from './ActionModal';

export const CreateClassModal: React.FC = () => {
  const { createClassModal } = useGameActions();
  const { data: walletClient } = useWalletClient();

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
  const characterLimitMessage = useCharacterLimitMessage({
    characterLimit: 200,
    currentCharacterCount: classDescription.length,
  });
  const [isClaimable, setIsClaimable] = useState<boolean>(false);

  const [showError, setShowError] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);

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
  }, [setClassEmblem]);

  const onCreateClass = useCallback(async () => {
    if (hasError) {
      setShowError(true);
      return null;
    }

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

    try {
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
      return transactionhash;
    } catch (e) {
      throw e;
    } finally {
      setIsCreating(false);
    }
  }, [
    classDescription,
    className,
    game,
    hasError,
    isClaimable,
    onUpload,
    walletClient,
  ]);

  const isLoading = isCreating;
  const isDisabled = isLoading || isUploading;

  return (
    <ActionModal
      {...{
        isOpen: createClassModal?.isOpen,
        onClose: createClassModal?.onClose,
        header: 'Create a Class',
        loadingText: `Your class is being created...`,
        successText: 'Your class was successfully created!',
        errorText: 'There was an error creating your class.',
        resetData,
        onAction: onCreateClass,
        onComplete: reloadGame,
      }}
    >
      <VStack spacing={8}>
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
          <FormLabel>Class Description ({characterLimitMessage})</FormLabel>
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
          isDisabled={isDisabled}
          isLoading={isLoading}
          loadingText="Creating..."
          type="submit"
          variant="solid"
          alignSelf="flex-end"
        >
          Create
        </Button>
      </VStack>
    </ActionModal>
  );
};
