import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
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

export const UpdateCharacterNameModal: React.FC = () => {
  const { game, reload: reloadGame } = useGame();
  const { selectedCharacter, editNameModal } = useActions();

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const toast = useToast();

  const [newName, setNewName] = useState<string>('');

  const [showError, setShowError] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSynced, setIsSynced] = useState<boolean>(false);

  const invalidName = useMemo(
    () => newName === selectedCharacter?.name && !!newName,
    [newName, selectedCharacter?.name],
  );

  const hasError = useMemo(
    () => !newName || invalidName,
    [invalidName, newName],
  );

  // Removes error message when user starts typing
  useEffect(() => {
    setShowError(false);
  }, [newName]);

  const resetData = useCallback(() => {
    setNewName('');
    setShowError(false);

    setIsUpdating(false);
    setTxHash(null);
    setIsSyncing(false);
    setIsSynced(false);
  }, []);

  useEffect(() => {
    if (!editNameModal?.isOpen) {
      resetData();
    }
  }, [resetData, editNameModal?.isOpen]);

  const onUpdateName = useCallback(
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

      setIsUpdating(true);

      try {
        const transactionhash = await walletClient.writeContract({
          chain: walletClient.chain,
          account: walletClient.account?.address as Address,
          address: game.id as Address,
          abi: parseAbi([
            'function updateCharacterName(string calldata newName) public',
          ]),
          functionName: 'updateCharacterName',
          args: [newName],
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
          description: `Something went wrong updating ${selectedCharacter.name}'s name.`,
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
      publicClient,
      reloadGame,
      selectedCharacter,
      toast,
      walletClient,
    ],
  );

  const isLoading = isUpdating;
  const isDisabled = isLoading;

  const content = () => {
    if (isSynced) {
      return (
        <VStack py={10} spacing={4}>
          <Text>
            Your character{`'`}s has been updated to {newName}!
          </Text>
          <Button onClick={editNameModal?.onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

    if (txHash && selectedCharacter) {
      return (
        <TransactionPending
          isSyncing={isSyncing}
          text={`Updating the name ${selectedCharacter.name} to ${newName}...`}
          txHash={txHash}
        />
      );
    }

    return (
      <VStack as="form" onSubmit={onUpdateName} spacing={8}>
        <FormControl isInvalid={showError}>
          <FormLabel>New Character Name</FormLabel>
          <Input onChange={e => setNewName(e.target.value)} value={newName} />
          {showError && !newName && (
            <FormHelperText color="red">
              New character name is required
            </FormHelperText>
          )}
          {showError && invalidName && (
            <FormHelperText color="red">
              New name must be different from the old name
            </FormHelperText>
          )}
        </FormControl>
        <Button
          alignSelf="flex-end"
          isDisabled={isDisabled}
          isLoading={isLoading}
          loadingText="Updating..."
          type="submit"
        >
          Update
        </Button>
      </VStack>
    );
  };

  return (
    <Modal
      closeOnEsc={!isLoading}
      closeOnOverlayClick={!isLoading}
      isOpen={editNameModal?.isOpen ?? false}
      onClose={editNameModal?.onClose ?? (() => {})}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Text>Update Character Name</Text>
          <ModalCloseButton size="lg" />
        </ModalHeader>
        <ModalBody>{content()}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
