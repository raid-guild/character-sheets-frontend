import {
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Image,
  Input,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Address, parseAbi } from 'viem';
import { useWalletClient } from 'wagmi';

import { useGameActions } from '@/contexts/GameActionsContext';
import { useGame } from '@/contexts/GameContext';
import { useCharacterLimitMessage } from '@/hooks/useCharacterLimitMessage';
import { useUploadFile } from '@/hooks/useUploadFile';

import { ActionModal } from './ActionModal';

export const UpdateGameMetadataModal: React.FC = () => {
  const { updateGameMetadataModal } = useGameActions();
  const { game, reload: reloadGame } = useGame();

  const { data: walletClient } = useWalletClient();

  const {
    file: newGameEmblemFile,
    setFile: setNewGameEmblem,
    onRemove,
    onUpload,
    isUploading,
    isUploaded,
  } = useUploadFile({ fileName: 'gameEmblem' });

  const [newGameName, setNewGameName] = useState<string>('');
  const [newGameDescription, setNewGameDescription] = useState<string>('');
  const characterLimitMessage = useCharacterLimitMessage({
    characterLimit: 200,
    currentCharacterCount: newGameDescription.length,
  });
  const [newGameEmblemImage, setNewGameEmblemImage] = useState<string | null>(
    null,
  );

  const [showError, setShowError] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const sameName = useMemo(
    () => newGameName === game?.name && !!newGameName,
    [newGameName, game?.name],
  );

  const invalidDescription = useMemo(() => {
    return !!newGameDescription && newGameDescription.length > 200;
  }, [newGameDescription]);

  const sameDescription = useMemo(() => {
    return !!newGameDescription && game?.description === newGameDescription;
  }, [newGameDescription, game?.description]);

  const sameEmblem = useMemo(() => {
    return !!newGameEmblemImage && newGameEmblemImage === game?.image;
  }, [newGameEmblemImage, game?.image]);

  const hasError = useMemo(
    () =>
      !newGameName ||
      !newGameDescription ||
      invalidDescription ||
      !newGameEmblemImage ||
      (sameName && sameDescription && sameEmblem),
    [
      newGameName,
      newGameDescription,
      newGameEmblemImage,
      invalidDescription,
      sameName,
      sameDescription,
      sameEmblem,
    ],
  );

  // Removes error message when user starts typing or changes avatar
  useEffect(() => {
    setShowError(false);
  }, [newGameName, newGameDescription, newGameEmblemImage]);

  const resetData = useCallback(() => {
    setNewGameName(game?.name ?? '');
    setNewGameDescription(game?.description ?? '');
    setNewGameEmblemImage(game?.image ?? null);

    setShowError(false);
    onRemove();

    setIsUpdating(false);
  }, [game, onRemove]);

  useEffect(() => {
    if (newGameEmblemFile) {
      setNewGameEmblemImage(URL.createObjectURL(newGameEmblemFile));
    }
  }, [newGameEmblemFile]);

  const onRemoveImage = useCallback(() => {
    setNewGameEmblemImage(null);
    onRemove();
  }, [onRemove]);

  const onUpdateGameMetadata = useCallback(async () => {
    if (hasError) {
      setShowError(true);
      return null;
    }

    try {
      if (!walletClient) throw new Error('Wallet client is not connected');
      if (!game) throw new Error('Missing game data');

      const cid = newGameEmblemFile
        ? await onUpload()
        : game?.image
            .split('/')
            .filter(s => !!s)
            .pop();
      if (!cid)
        throw new Error('Something went wrong uploading your game emblem');

      const gameMetadata = {
        name: newGameName,
        description: newGameDescription,
        image: `ipfs://${cid}`,
      };

      const res = await fetch('/api/uploadMetadata?name=gameMetadata.json', {
        method: 'POST',
        body: JSON.stringify(gameMetadata),
      });
      if (!res.ok)
        throw new Error('Something went wrong uploading game metadata');

      const { cid: newCid } = await res.json();
      if (!newCid)
        throw new Error('Something went wrong uploading game metadata');

      const transactionhash = await walletClient.writeContract({
        chain: walletClient.chain,
        account: walletClient.account?.address as Address,
        address: game.id as Address,
        abi: parseAbi([
          'function updateMetadataUri(string memory _uri) public',
        ]),
        functionName: 'updateMetadataUri',
        args: [`ipfs://${newCid}`],
      });
      return transactionhash;
    } catch (e) {
      throw e;
    } finally {
      setIsUpdating(false);
    }
  }, [
    game,
    hasError,
    newGameName,
    newGameEmblemFile,
    newGameDescription,
    onUpload,
    walletClient,
  ]);

  const isLoading = isUpdating;
  const isDisabled = isLoading;

  const noChanges = useMemo(() => {
    return sameName && sameDescription && sameEmblem;
  }, [sameName, sameDescription, sameEmblem]);

  return (
    <ActionModal
      {...{
        isOpen: updateGameMetadataModal?.isOpen,
        onClose: updateGameMetadataModal?.onClose,
        header: `Update Game`,
        loadingText: `Updating game...`,
        successText: `Game successfully updated!`,
        errorText: `There was an error updating your game.`,
        resetData,
        onAction: onUpdateGameMetadata,
        onComplete: reloadGame,
      }}
    >
      <VStack spacing={8}>
        <FormControl isInvalid={showError && (!newGameName || noChanges)}>
          <FormLabel>Game Name</FormLabel>
          <Input
            onChange={e => setNewGameName(e.target.value)}
            value={newGameName}
          />
          {showError && !newGameName && (
            <FormHelperText color="red">A game name is required</FormHelperText>
          )}
          {showError && noChanges && (
            <FormHelperText color="red">
              New name, description, or emblem must be different from the old
            </FormHelperText>
          )}
        </FormControl>
        <FormControl
          isInvalid={
            showError &&
            (!newGameDescription || invalidDescription || noChanges)
          }
        >
          <FormLabel>Game Description ({characterLimitMessage})</FormLabel>
          <Textarea
            onChange={e => setNewGameDescription(e.target.value)}
            value={newGameDescription}
          />
          {showError && !newGameDescription && (
            <FormHelperText color="red">
              A game description is required
            </FormHelperText>
          )}
          {showError && invalidDescription && (
            <FormHelperText color="red">
              Game description must be less than 200 characters
            </FormHelperText>
          )}
          {showError && noChanges && (
            <FormHelperText color="red">
              New name, description, or emblem must be different from the old
            </FormHelperText>
          )}
        </FormControl>
        <FormControl
          isInvalid={showError && (!newGameEmblemImage || noChanges)}
        >
          <FormLabel>Game Emblem</FormLabel>
          {!newGameEmblemImage && (
            <Input
              accept=".png, .jpg, .jpeg, .svg"
              disabled={isUploading}
              onChange={e => setNewGameEmblem(e.target.files?.[0] ?? null)}
              type="file"
              variant="file"
            />
          )}
          {newGameEmblemImage && (
            <Flex
              align="center"
              flexDir={{ base: 'column', sm: 'row' }}
              gap={10}
              mt={4}
            >
              <Image
                alt="game emblem"
                objectFit="contain"
                src={newGameEmblemImage}
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
          {showError && !newGameEmblemImage && (
            <FormHelperText color="red">
              A game emblem is required
            </FormHelperText>
          )}
          {showError && noChanges && (
            <FormHelperText color="red">
              New name, description, emblem, or base token URI must be different
              from the old
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
    </ActionModal>
  );
};
