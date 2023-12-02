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
import { Address, useNetwork, usePublicClient, useWalletClient } from 'wagmi';

import { TransactionPending } from '@/components/TransactionPending';
import { useCharacterActions } from '@/contexts/CharacterActionsContext';
import { useGame } from '@/contexts/GameContext';
import { waitUntilBlock } from '@/graphql/health';
import { useCharacterLimitMessage } from '@/hooks/useCharacterLimitMessage';
import { useToast } from '@/hooks/useToast';
import { useUploadFile } from '@/hooks/useUploadFile';
import { getChainLabelFromId } from '@/lib/web3';
import { BASE_CHARACTER_URI } from '@/utils/constants';

export const UpdateCharacterMetadataModal: React.FC = () => {
  const { game, reload: reloadGame } = useGame();
  const { selectedCharacter, editCharacterModal } = useCharacterActions();

  const { data: walletClient } = useWalletClient();
  const { chain } = useNetwork();
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
  const characterLimitMessage = useCharacterLimitMessage({
    characterLimit: 200,
    currentCharacterCount: newDescription.length,
  });
  const [newAvatarImage, setNewAvatarImage] = useState<string | null>(null);

  const [showError, setShowError] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txFailed, setTxFailed] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSynced, setIsSynced] = useState<boolean>(false);

  const uriNeedsUpgraded = useMemo(() => {
    if (!(chain && selectedCharacter)) return false;
    const chainLabel = getChainLabelFromId(chain.id);
    const { uri } = selectedCharacter;
    const potentialCID = uri
      .split('/')
      .filter(s => !!s)
      .pop();

    if (!(chainLabel && potentialCID)) return false;

    const baseURI = uri.replace(potentialCID, '');
    if (baseURI !== `${BASE_CHARACTER_URI}${chainLabel}/`) return false;

    return potentialCID.match(/^[a-zA-Z0-9]{46,59}$/);
  }, [chain, selectedCharacter]);

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
      (!uriNeedsUpgraded && sameName && sameDescription && sameAvatar),
    [
      newName,
      newDescription,
      newAvatarImage,
      invalidDescription,
      sameName,
      sameDescription,
      sameAvatar,
      uriNeedsUpgraded,
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
    if (editCharacterModal?.isOpen) {
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
        if (!chain) throw new Error('Could not find a connected chain');
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

        const characterMetadata: {
          name: string;
          description: string;
          image: string;
          attributes: {
            trait_type: string;
            value: string;
          }[];
        } = {
          name: newName,
          description: newDescription,
          image: `ipfs://${cid}`,
          attributes: [],
        };

        if (!newAvatarFile && selectedCharacter.attributes) {
          characterMetadata['attributes'] = selectedCharacter.attributes;
        }

        const chainLabel = getChainLabelFromId(chain.id);
        const apiRoute = `/api/characters/${chainLabel}/${selectedCharacter.id}/update`;
        const signature = await walletClient.signMessage({
          message: apiRoute,
          account: walletClient.account?.address as Address,
        });

        const res = await fetch(apiRoute, {
          headers: {
            'x-account-address': walletClient.account?.address as Address,
            'x-account-signature': signature,
            'x-account-chain-id': walletClient.chain.id.toString(),
          },
          method: 'POST',
          body: JSON.stringify(characterMetadata),
        });
        if (!res.ok)
          throw new Error(
            "Something went wrong updating your character's metadata",
          );

        const { name, description, image } = await res.json();
        if (!(name && description && image))
          throw new Error(
            'Something went wrong updating your character metadata',
          );

        if (uriNeedsUpgraded) {
          const transactionhash = await walletClient.writeContract({
            chain: walletClient.chain,
            account: walletClient.account?.address as Address,
            address: game.id as Address,
            abi: parseAbi([
              'function updateCharacterMetadata(string calldata newCid) public',
            ]),
            functionName: 'updateCharacterMetadata',
            args: [selectedCharacter.id],
          });
          setTxHash(transactionhash);

          const client = publicClient ?? walletClient;
          const { blockNumber, status } =
            await client.waitForTransactionReceipt({
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
        }

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
      chain,
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
      uriNeedsUpgraded,
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
        {uriNeedsUpgraded && (
          <Text>
            Your metadata URI is out of date. Please click &quot;Update&quot;
            below to upgrade to the latest version.
          </Text>
        )}
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
          <FormLabel>Character Description ({characterLimitMessage})</FormLabel>
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
            <Flex
              align="center"
              flexDir={{ base: 'column', sm: 'row' }}
              gap={10}
              mt={4}
            >
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
      <ModalContent mt={{ base: 0, md: '84px' }}>
        <ModalHeader>
          <Text>Update Character</Text>
          <ModalCloseButton size="lg" />
        </ModalHeader>
        <ModalBody>{content()}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
