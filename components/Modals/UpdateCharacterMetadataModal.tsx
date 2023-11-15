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
  VStack,
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { parseAbi } from 'viem';
import { Address, usePublicClient, useWalletClient } from 'wagmi';

import { TransactionPending } from '@/components/TransactionPending';
import { useCharacterActions } from '@/contexts/CharacterActionsContext';
import { useGame } from '@/contexts/GameContext';
import { waitUntilBlock } from '@/graphql/health';
import { useToast } from '@/hooks/useToast';
import { useUploadFile } from '@/hooks/useUploadFile';

export const UpdateCharacterMetadataModal: React.FC = () => {
  const { game, reload: reloadGame } = useGame();
  const { selectedCharacter, editCharacterModal } = useCharacterActions();

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { renderError } = useToast();

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
  const [txFailed, setTxFailed] = useState<boolean>(false);
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
    setTxFailed(false);
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

      try {
        if (!walletClient) throw new Error('Could not find a wallet client');
        if (!game) throw new Error('Missing game data');
        if (!selectedCharacter) throw new Error('Character not found');

        const cid = newAvatarFile
          ? await onUpload()
          : selectedCharacter?.image
              .split('/')
              .filter(s => !!s)
              .pop();
        if (!cid)
          throw new Error(
            'Something went wrong uploading your character avatar',
          );

        setIsUpdating(true);

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
        if (!res.ok)
          throw new Error(
            "Something went wrong uploading your character's metadata",
          );

        const { cid: newCid } = await res.json();
        if (!newCid)
          throw new Error(
            'Something went wrong uploading your character metadata',
          );

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
        const { blockNumber, status } = await client.waitForTransactionReceipt({
          hash: transactionhash,
        });

        if (status === 'reverted') {
          setTxFailed(true);
          setIsUpdating(false);
          throw new Error('Transaction failed');
        }

        setIsSyncing(true);
        const synced = await waitUntilBlock(client.chain.id, blockNumber);
        if (!synced) throw new Error('Something went wrong while syncing');

        setIsSynced(true);
        reloadGame();
      } catch (e) {
        renderError(
          e,
          `Something went wrong updating ${selectedCharacter?.name}'s metadata`,
        );
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
      renderError,
      selectedCharacter,
      walletClient,
    ],
  );

  const isLoading = isUpdating;
  const isDisabled = isLoading;

  const noChanges = useMemo(() => {
    return sameName && sameDescription && sameAvatar;
  }, [sameName, sameDescription, sameAvatar]);

  const content = () => {
    if (txFailed) {
      return (
        <VStack py={10} spacing={4}>
          <Text>Transaction failed.</Text>
          <Button onClick={editCharacterModal?.onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

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
          chainId={game?.chainId}
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
            variant="solid"
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
      <ModalContent>
        <ModalHeader>
          <Text>Update Character</Text>
          <ModalCloseButton size="lg" />
        </ModalHeader>
        <ModalBody>{content()}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
