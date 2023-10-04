import {
  Button,
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
import { useCallback, useEffect, useState } from 'react';
import { parseAbi } from 'viem';
import { Address, usePublicClient, useWalletClient } from 'wagmi';

import { TransactionPending } from '@/components/TransactionPending';
import { useActions } from '@/contexts/ActionsContext';
import { useGame } from '@/contexts/GameContext';
import { waitUntilBlock } from '@/hooks/useGraphHealth';

export const RemoveCharacterModal: React.FC = () => {
  const { game, reload: reloadGame } = useGame();
  const { selectedCharacter, removeCharacterModal } = useActions();

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const toast = useToast();

  const [isRemoving, setIsRemoving] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSynced, setIsSynced] = useState<boolean>(false);

  const resetData = useCallback(() => {
    setIsRemoving(false);
    setTxHash(null);
    setIsSyncing(false);
    setIsSynced(false);
  }, []);

  useEffect(() => {
    if (!removeCharacterModal?.isOpen) {
      resetData();
    }
  }, [resetData, removeCharacterModal?.isOpen]);

  const onRemoveSheet = useCallback(
    async (e: React.FormEvent<HTMLDivElement>) => {
      e.preventDefault();

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

      if (!selectedCharacter.jailed) {
        toast({
          description: 'Player must be jailed be sheet is removed.',
          position: 'top',
          status: 'error',
        });
        console.error('Player must be jailed be sheet is removed.');
        return;
      }

      setIsRemoving(true);

      try {
        const transactionhash = await walletClient.writeContract({
          chain: walletClient.chain,
          account: walletClient.account?.address as Address,
          address: game.id as Address,
          abi: parseAbi(['function removeSheet(uint256 characterId) public']),
          functionName: 'removeSheet',
          args: [BigInt(selectedCharacter.characterId)],
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
          description: `Something went wrong while removing ${selectedCharacter.name}`,
          position: 'top',
          status: 'error',
        });
        console.error(e);
      } finally {
        setIsSyncing(false);
        setIsRemoving(false);
      }
    },
    [game, publicClient, reloadGame, selectedCharacter, toast, walletClient],
  );

  const isLoading = isRemoving;
  const isDisabled = isLoading;

  const content = () => {
    if (isSynced && selectedCharacter) {
      return (
        <VStack py={10} spacing={4}>
          <Text>{selectedCharacter.name} has been removed!</Text>
          <Button onClick={removeCharacterModal?.onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

    if (txHash && selectedCharacter) {
      return (
        <TransactionPending
          isSyncing={isSyncing}
          text={`Removing ${selectedCharacter.name}...`}
          txHash={txHash}
        />
      );
    }

    return (
      <VStack as="form" onSubmit={onRemoveSheet} spacing={8}>
        <Text textAlign="center">
          Are you sure you want to remove {selectedCharacter?.name}? This action
          is irreversible.
        </Text>
        <Button
          autoFocus
          isDisabled={isDisabled}
          isLoading={isLoading}
          loadingText="Removing..."
          type="submit"
        >
          Remove
        </Button>
      </VStack>
    );
  };

  return (
    <Modal
      closeOnEsc={!isLoading}
      closeOnOverlayClick={!isLoading}
      isOpen={removeCharacterModal?.isOpen ?? false}
      onClose={removeCharacterModal?.onClose ?? (() => {})}
    >
      <ModalOverlay />
      <ModalContent bg='gray.800'>
        <ModalHeader>
          <Text>Remove Character</Text>
          <ModalCloseButton size="lg" />
        </ModalHeader>
        <ModalBody>{content()}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
