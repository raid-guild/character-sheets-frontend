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
import { useGame } from '@/contexts/GameContext';
import { waitUntilBlock } from '@/hooks/useGraphHealth';
import { useToast } from '@/hooks/useToast';
import { useUploadFile } from '@/hooks/useUploadFile';

type UpdateGameMetadataModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const UpdateGameMetadataModal: React.FC<
  UpdateGameMetadataModalProps
> = ({ isOpen, onClose }) => {
  const { game, reload: reloadGame } = useGame();

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { renderError } = useToast();

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
  const [newGameEmblemImage, setNewGameEmblemImage] = useState<string | null>(
    null,
  );

  const [showError, setShowError] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txFailed, setTxFailed] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSynced, setIsSynced] = useState<boolean>(false);

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
    setTxHash(null);
    setTxFailed(false);
    setIsSyncing(false);
    setIsSynced(false);
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

  useEffect(() => {
    if (!isOpen) {
      resetData();
    }
  }, [resetData, isOpen]);

  const onUpdateGameMetadata = useCallback(
    async (e: React.FormEvent<HTMLDivElement>) => {
      e.preventDefault();

      if (hasError) {
        setShowError(true);
        return;
      }

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

      setIsUpdating(true);

      try {
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
          abi: parseAbi(['function setMetadataUri(string memory _uri) public']),
          functionName: 'setMetadataUri',
          args: [`ipfs://${newCid}`],
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
        const synced = await waitUntilBlock(blockNumber);
        if (!synced) throw new Error('Something went wrong while syncing');

        setIsSynced(true);
        reloadGame();
      } catch (e) {
        renderError(e, 'Something went wrong updating game metadata');
      } finally {
        setIsSyncing(false);
        setIsUpdating(false);
      }
    },
    [
      game,
      hasError,
      newGameName,
      newGameEmblemFile,
      newGameDescription,
      onUpload,
      publicClient,
      reloadGame,
      renderError,
      walletClient,
    ],
  );

  const isLoading = isUpdating;
  const isDisabled = isLoading;

  const noChanges = useMemo(() => {
    return sameName && sameDescription && sameEmblem;
  }, [sameName, sameDescription, sameEmblem]);

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
          <Text>Your game has been updated!</Text>
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
          text={`Updating your game...`}
          txHash={txHash}
        />
      );
    }

    return (
      <VStack as="form" onSubmit={onUpdateGameMetadata} spacing={8}>
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
          <FormLabel>Game Description (200 character limit)</FormLabel>
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
            <Flex align="center" gap={10} mt={4}>
              <Image
                alt="game emblem"
                objectFit="contain"
                src={newGameEmblemImage}
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
          {showError && !newGameEmblemImage && (
            <FormHelperText color="red">
              A game emblem is required
            </FormHelperText>
          )}
          {showError && noChanges && (
            <FormHelperText color="red">
              New name, description, or emblem must be different from the old
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
      isOpen={isOpen}
      onClose={onClose}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Text>Update Game</Text>
          <ModalCloseButton size="lg" />
        </ModalHeader>
        <ModalBody>{content()}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
