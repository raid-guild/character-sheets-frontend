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
import { useActions } from '@/contexts/ActionsContext';
import { useGame } from '@/contexts/GameContext';
import { waitUntilBlock } from '@/hooks/useGraphHealth';
import { useToast } from '@/hooks/useToast';

export const JailPlayerModal: React.FC = () => {
  const { game, reload: reloadGame } = useGame();
  const { selectedCharacter, jailPlayerModal } = useActions();

  const { jailed } = selectedCharacter ?? {};

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { renderError } = useToast();

  const [isJailing, setIsJailing] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txFailed, setTxFailed] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSynced, setIsSynced] = useState<boolean>(false);

  const resetData = useCallback(() => {
    setIsJailing(false);
    setTxHash(null);
    setTxFailed(false);
    setIsSyncing(false);
    setIsSynced(false);
  }, []);

  useEffect(() => {
    if (!jailPlayerModal?.isOpen) {
      resetData();
    }
  }, [resetData, jailPlayerModal?.isOpen]);

  const onJailPlayer = useCallback(
    async (e: React.FormEvent<HTMLDivElement>) => {
      e.preventDefault();

      if (!walletClient) throw new Error('Could not find a wallet client');
      if (!game) throw new Error('Missing game data');
      if (!selectedCharacter) throw new Error('Character not found');

      setIsJailing(true);

      try {
        const transactionhash = await walletClient.writeContract({
          chain: walletClient.chain,
          account: walletClient.account?.address as Address,
          address: game.id as Address,
          abi: parseAbi([
            'function jailPlayer(address playerAddress, bool throwInJail) public',
          ]),
          functionName: 'jailPlayer',
          args: [selectedCharacter.player as `0x${string}`, !jailed],
        });
        setTxHash(transactionhash);

        const client = publicClient ?? walletClient;
        const { blockNumber, status } = await client.waitForTransactionReceipt({
          hash: transactionhash,
        });

        if (status === 'reverted') {
          setTxFailed(true);
          setIsJailing(false);
          throw new Error('Transaction failed');
        }

        setIsSyncing(true);
        const synced = await waitUntilBlock(blockNumber);
        if (!synced) throw new Error('Something went wrong while syncing');

        setIsSynced(true);
        reloadGame();
      } catch (e) {
        renderError(
          e,
          `Something went wrong while jailing ${selectedCharacter.name}'s player`,
        );
      } finally {
        setIsSyncing(false);
        setIsJailing(false);
      }
    },
    [
      game,
      jailed,
      publicClient,
      reloadGame,
      renderError,
      selectedCharacter,
      walletClient,
    ],
  );

  const isLoading = isJailing;
  const isDisabled = isLoading;

  const content = () => {
    if (txFailed) {
      return (
        <VStack py={10} spacing={4}>
          <Text>Transaction failed.</Text>
          <Button onClick={jailPlayerModal?.onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

    if (isSynced && selectedCharacter) {
      return (
        <VStack py={10} spacing={4}>
          <Text>
            {selectedCharacter.name}
            {`'`}s player has been {jailed ? 'freed' : 'jailed'}!
          </Text>
          <Button onClick={jailPlayerModal?.onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

    if (txHash && selectedCharacter) {
      return (
        <TransactionPending
          isSyncing={isSyncing}
          text={`${jailed ? 'Freeing' : 'Jailing'} your ${
            selectedCharacter.name
          }'s player...`}
          txHash={txHash}
        />
      );
    }

    return (
      <VStack as="form" onSubmit={onJailPlayer} spacing={8}>
        <Text textAlign="center">
          Are you sure you want to {jailed ? 'free' : 'jail'}{' '}
          {selectedCharacter?.name}
          {`'`}s player?
        </Text>
        <Button
          autoFocus
          isDisabled={isDisabled}
          isLoading={isLoading}
          loadingText={`${jailed ? 'Freeing' : 'Jailing'}...`}
          type="submit"
        >
          {jailed ? 'Free' : 'Jail'}
        </Button>
      </VStack>
    );
  };

  return (
    <Modal
      closeOnEsc={!isLoading}
      closeOnOverlayClick={!isLoading}
      isOpen={jailPlayerModal?.isOpen ?? false}
      onClose={jailPlayerModal?.onClose ?? (() => {})}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {jailed && !isSynced && <Text>Free Character</Text>}
          {!jailed && !isSynced && <Text>Jail Character</Text>}
          {isSynced && <Text>Success!</Text>}
          <ModalCloseButton size="lg" />
        </ModalHeader>
        <ModalBody>{content()}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
