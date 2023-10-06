import {
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
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
import { parseAbi } from 'viem';
import { Address, usePublicClient, useWalletClient } from 'wagmi';

import { TransactionPending } from '@/components/TransactionPending';
import { useActions } from '@/contexts/ActionsContext';
import { useGame } from '@/contexts/GameContext';
import { waitUntilBlock } from '@/hooks/useGraphHealth';
import { useUploadFile } from '@/hooks/useUploadFile';

export const UpdateCharacterMetadataModal: React.FC = () => {
  const { game, reload: reloadGame } = useGame();
  const { selectedCharacter, editCharacterModal } = useActions();

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const toast = useToast();

  const {
    file: newAvatarFile,
    setFile: setNewAvatar,
    onRemove,
    onUpload,
    isUploading,
    isUploaded,
  } = useUploadFile({ fileName: 'characterAvatar' });
  const [newName, setNewName] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');

  const [newAvatarImage, setNewAvatarImage] = useState<string | null>(null);

  const [showError, setShowError] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSynced, setIsSynced] = useState<boolean>(false);

  const sameName = useMemo(
    () => newName === selectedCharacter?.name && !!newName,
    [newName, selectedCharacter?.name],
  );

  const invalidDescription = useMemo(() => {
    return !!newDescription && newDescription.length > 200;
  }, [newDescription]);

  const sameDescription = useMemo(() => {
    return (
      !!newDescription && selectedCharacter?.description === newDescription
    );
  }, [newDescription, selectedCharacter?.description]);

  const sameAvatar = useMemo(() => {
    return !!newAvatarImage && newAvatarImage === selectedCharacter?.image;
  }, [newAvatarImage, selectedCharacter?.image]);

  const hasError = useMemo(
    () =>
      !newName ||
      !newDescription ||
      invalidDescription ||
      !newAvatarImage ||
      (sameName && sameDescription && sameAvatar),
    [
      newName,
      newDescription,
      newAvatarImage,
      invalidDescription,
      sameName,
      sameDescription,
      sameAvatar,
    ],
  );

  // Removes error message when user starts typing or changes avatar
  useEffect(() => {
    setShowError(false);
  }, [newName, newDescription, newAvatarImage]);

  const resetData = useCallback(() => {
    setNewName(selectedCharacter?.name ?? '');
    setNewDescription(selectedCharacter?.description ?? '');
    setNewAvatarImage(selectedCharacter?.image ?? null);
    setShowError(false);
    onRemove();

    setIsUpdating(false);
    setTxHash(null);
    setIsSyncing(false);
    setIsSynced(false);
  }, [selectedCharacter, onRemove]);

  useEffect(() => {
    if (newAvatarFile) {
      setNewAvatarImage(URL.createObjectURL(newAvatarFile));
    }
  }, [newAvatarFile]);

  const onRemoveImage = useCallback(() => {
    setNewAvatarImage(null);
    onRemove();
  }, [onRemove]);

  useEffect(() => {
    if (!editCharacterModal?.isOpen) {
      resetData();
    }
  }, [resetData, editCharacterModal?.isOpen]);

  const onUpdateCharacterMetadata = useCallback(
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

      if (!game) {
        toast({
          description: `Could not find the game.`,
          position: 'top',
          status: 'error',
        });
        console.error(`Missing game data.`);
        return;
      }

      if (!selectedCharacter) {
        toast({
          description: 'Character not found.',
          position: 'top',
          status: 'error',
        });
        console.error('Character not found.');
        return;
      }

      const cid = newAvatarFile
        ? await onUpload()
        : selectedCharacter?.image
            .split('/')
            .filter(s => !!s)
            .pop();

      if (!cid) {
        toast({
          description: 'Something went wrong uploading your character avatar.',
          position: 'top',
          status: 'error',
        });
        return;
      }

      setIsUpdating(true);

      try {
        const characterMetadata = {
          name: newName,
          description: newDescription,
          image: `ipfs://${cid}`,
        };

        const res = await fetch(
          '/api/uploadMetadata?name=characterMetadata.json',
          {
            method: 'POST',
            body: JSON.stringify(characterMetadata),
          },
        );

        if (!res.ok) {
          toast({
            description:
              "Something went wrong uploading your character's metadata.",
            position: 'top',
            status: 'error',
          });
          return;
        }

        const { cid: newCid } = await res.json();

        if (!newCid) {
          toast({
            description:
              'Something went wrong uploading your character metadata.',
            position: 'top',
            status: 'error',
          });
          return;
        }

        const transactionhash = await walletClient.writeContract({
          chain: walletClient.chain,
          account: walletClient.account?.address as Address,
          address: game.id as Address,
          abi: parseAbi([
            'function updateCharacterMetadata(string calldata newCid) public',
          ]),
          functionName: 'updateCharacterMetadata',
          args: [newCid],
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
        reloadGame();
      } catch (e) {
        toast({
          description: `Something went wrong updating ${selectedCharacter.name}'s metadata.`,
          position: 'top',
          status: 'error',
        });
        console.error(e);
      } finally {
        setIsSyncing(false);
        setIsUpdating(false);
      }
    },
    [
      game,
      hasError,
      newName,
      newAvatarFile,
      newDescription,
      onUpload,
      publicClient,
      reloadGame,
      selectedCharacter,
      toast,
      walletClient,
    ],
  );

  const isLoading = isUpdating;
  const isDisabled = isLoading;

  const noChanges = useMemo(() => {
    return sameName && sameDescription && sameAvatar;
  }, [sameName, sameDescription, sameAvatar]);

  const content = () => {
    if (isSynced) {
      return (
        <VStack py={10} spacing={4}>
          <Text>Your character has been updated!</Text>
          <Button onClick={editCharacterModal?.onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

    if (txHash && selectedCharacter) {
      return (
        <TransactionPending
          isSyncing={isSyncing}
          text={`Updating your character...`}
          txHash={txHash}
        />
      );
    }

    return (
      <VStack as="form" onSubmit={onUpdateCharacterMetadata} spacing={8}>
        <FormControl isInvalid={showError && (!newName || noChanges)}>
          <FormLabel>Character Name</FormLabel>
          <Input onChange={e => setNewName(e.target.value)} value={newName} />
          {showError && !newName && (
            <FormHelperText color="red">
              A character name is required
            </FormHelperText>
          )}
          {showError && noChanges && (
            <FormHelperText color="red">
              New name, description, or avatar must be different from the old
            </FormHelperText>
          )}
        </FormControl>
        <FormControl
          isInvalid={
            showError && (!newDescription || invalidDescription || noChanges)
          }
        >
          <FormLabel>Character Description (200 character limit)</FormLabel>
          <Textarea
            onChange={e => setNewDescription(e.target.value)}
            value={newDescription}
          />
          {showError && !newDescription && (
            <FormHelperText color="red">
              A character description is required
            </FormHelperText>
          )}
          {showError && invalidDescription && (
            <FormHelperText color="red">
              Character description must be less than 200 characters
            </FormHelperText>
          )}
          {showError && noChanges && (
            <FormHelperText color="red">
              New name, description, or avatar must be different from the old
            </FormHelperText>
          )}
        </FormControl>
        <FormControl isInvalid={showError && (!newAvatarImage || noChanges)}>
          <FormLabel>Character Avatar</FormLabel>
          {!newAvatarImage && (
            <Input
              accept=".png, .jpg, .jpeg, .svg"
              disabled={isUploading}
              onChange={e => setNewAvatar(e.target.files?.[0] ?? null)}
              type="file"
              variant="file"
            />
          )}
          {newAvatarImage && (
            <Flex align="center" gap={10} mt={4}>
              <Image
                alt="character avatar"
                objectFit="contain"
                src={newAvatarImage}
                w="300px"
              />
              <Button
                isDisabled={isUploading || isUploaded}
                isLoading={isUploading}
                loadingText="Uploading..."
                mt={4}
                onClick={!isUploaded ? onRemoveImage : undefined}
                type="button"
                variant="outline"
              >
                {isUploaded ? 'Uploaded' : 'Remove'}
              </Button>
            </Flex>
          )}
          {showError && !newAvatarImage && (
            <FormHelperText color="red">
              A character avatar is required
            </FormHelperText>
          )}
          {showError && noChanges && (
            <FormHelperText color="red">
              New name, description, or avatar must be different from the old
            </FormHelperText>
          )}
        </FormControl>
        <HStack spacing={4} justify="end" w="100%">
          <Button
            isDisabled={isDisabled}
            onClick={() => resetData()}
            type="button"
            variant="ghost"
          >
            Reset
          </Button>
          <Button
            alignSelf="flex-end"
            isDisabled={isDisabled}
            isLoading={isLoading}
            loadingText="Updating..."
            type="submit"
          >
            Update
          </Button>
        </HStack>
      </VStack>
    );
  };

  return (
    <Modal
      closeOnEsc={!isLoading}
      closeOnOverlayClick={!isLoading}
      isOpen={editCharacterModal?.isOpen ?? false}
      onClose={editCharacterModal?.onClose ?? (() => {})}
    >
      <ModalOverlay />
      <ModalContent bg="gray.800">
        <ModalHeader>
          <Text>Update Character</Text>
          <ModalCloseButton size="lg" />
        </ModalHeader>
        <ModalBody>{content()}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
