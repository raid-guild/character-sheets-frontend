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

export const JailPlayerModal: React.FC = () => {
  const { game, reload: reloadGame } = useGame();
  const { selectedCharacter, jailPlayerModal } = useActions();

  // const { isJailed } = selectedCharacter;
  const isJailed = false;

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const toast = useToast();

  const [isJailing, setIsJailing] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSynced, setIsSynced] = useState<boolean>(false);

  const resetData = useCallback(() => {
    setIsJailing(false);
    setTxHash(null);
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
          args: [selectedCharacter.player as `0x${string}`, !isJailed],
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
          description: `Something went wrong while jailing ${selectedCharacter.name}'s player.`,
          position: 'top',
          status: 'error',
        });
        console.error(e);
      } finally {
        setIsSyncing(false);
        setIsJailing(false);
      }
    },
    [
      game,
      isJailed,
      publicClient,
      reloadGame,
      selectedCharacter,
      toast,
      walletClient,
    ],
  );

  const isLoading = isJailing;
  const isDisabled = isLoading;

  const content = () => {
    if (isSynced && selectedCharacter) {
      return (
        <VStack py={10} spacing={4}>
          <Text>
            {selectedCharacter.name}
            {`'`}s player has been jailed!
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
          text={`Jailing your ${selectedCharacter.name}'s player...`}
          txHash={txHash}
        />
      );
    }

    return (
      <VStack as="form" onSubmit={onJailPlayer} spacing={8}>
        <Text textAlign="center">
          Are you sure you want to jail {selectedCharacter?.name}
          {`'`}s player?
        </Text>
        <Button
          autoFocus
          isDisabled={isDisabled}
          isLoading={isLoading}
          loadingText="Jailing..."
          type="submit"
        >
          Jail
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
          <Text>Jail Character</Text>
          <ModalCloseButton size="lg" />
        </ModalHeader>
        <ModalBody>{content()}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
