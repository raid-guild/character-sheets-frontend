import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';
import { parseAbi } from 'viem';
import { Address, usePublicClient, useWalletClient } from 'wagmi';

import { TransactionPending } from '@/components/TransactionPending';
import { useGameActions } from '@/contexts/GameActionsContext';
import { useGame } from '@/contexts/GameContext';
import { waitUntilBlock } from '@/graphql/health';
import { useToast } from '@/hooks/useToast';

export const RestoreCharacterModal: React.FC = () => {
  const { character, game, reload: reloadGame } = useGame();
  const { restoreCharacterModal } = useGameActions();

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { renderError } = useToast();

  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txFailed, setTxFailed] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSynced, setIsSynced] = useState<boolean>(false);

  const resetData = useCallback(() => {
    setIsRestoring(false);
    setTxHash(null);
    setTxFailed(false);
    setIsSyncing(false);
    setIsSynced(false);
  }, []);

  useEffect(() => {
    if (restoreCharacterModal?.isOpen) {
      resetData();
    }
  }, [restoreCharacterModal?.isOpen, resetData]);

  const onRestoreCharacter = useCallback(
    async (e: React.FormEvent<HTMLDivElement>) => {
      e.preventDefault();

      try {
        if (!walletClient) throw new Error('Could not find a wallet client');
        if (!game) throw new Error('Missing game data');
        if (!character) throw new Error('Character not found');

        setIsRestoring(true);

        const transactionhash = await walletClient.writeContract({
          chain: walletClient.chain,
          account: walletClient.account?.address as Address,
          address: game.id as Address,
          abi: parseAbi(['function restoreSheet() external']),
          functionName: 'restoreSheet',
        });
        setTxHash(transactionhash);

        const client = publicClient ?? walletClient;
        const { blockNumber, status } = await client.waitForTransactionReceipt({
          hash: transactionhash,
        });

        if (status === 'reverted') {
          setTxFailed(true);
          setIsRestoring(false);
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
          `Something went wrong while restoring ${character?.name}`,
        );
      } finally {
        setIsSyncing(false);
        setIsRestoring(false);
      }
    },
    [character, game, publicClient, reloadGame, renderError, walletClient],
  );

  const isLoading = isRestoring;
  const isDisabled = isLoading;

  const content = () => {
    if (txFailed) {
      return (
        <VStack py={10} spacing={4}>
          <Text>Transaction failed.</Text>
          <Button onClick={restoreCharacterModal?.onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

    if (isSynced) {
      return (
        <VStack py={10} spacing={4}>
          <Text>Your character has been restored!</Text>
          <Button onClick={restoreCharacterModal?.onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

    if (txHash && character) {
      return (
        <TransactionPending
          isSyncing={isSyncing}
          text="Restoring your character..."
          txHash={txHash}
          chainId={game?.chainId}
        />
      );
    }

    return (
      <VStack as="form" onSubmit={onRestoreCharacter} spacing={8}>
        <Text textAlign="center">
          Are you sure you want to restore your character?
        </Text>
        <Button
          autoFocus
          isDisabled={isDisabled}
          isLoading={isLoading}
          loadingText="Restoring..."
          type="submit"
          variant="solid"
          alignSelf="flex-end"
        >
          Restore
        </Button>
      </VStack>
    );
  };

  return (
    <Modal
      closeOnEsc={!isLoading}
      closeOnOverlayClick={!isLoading}
      isOpen={restoreCharacterModal?.isOpen ?? false}
      onClose={restoreCharacterModal?.onClose ?? (() => {})}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Text>Restore Character</Text>
          <ModalCloseButton size="lg" />
        </ModalHeader>
        <ModalBody>{content()}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
