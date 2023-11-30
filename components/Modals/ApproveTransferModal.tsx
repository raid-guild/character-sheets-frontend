import {
  Button,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
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
import { getAddressUrl } from '@/lib/web3';
import { shortenAddress } from '@/utils/helpers';

export const ApproveTransferModal: React.FC = () => {
  const { game, reload: reloadGame } = useGame();
  const { selectedCharacter, approveTransferModal } = useCharacterActions();

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { renderError } = useToast();

  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txFailed, setTxFailed] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSynced, setIsSynced] = useState<boolean>(false);

  const resetData = useCallback(() => {
    setIsApproving(false);
    setTxHash(null);
    setTxFailed(false);
    setIsSyncing(false);
    setIsSynced(false);
  }, []);

  useEffect(() => {
    if (!approveTransferModal?.isOpen) {
      resetData();
    }
  }, [resetData, approveTransferModal?.isOpen]);

  const gameOwner = useMemo(() => {
    if (!game) return null;
    return game.owner as Address;
  }, [game]);

  const onApproveTransfer = useCallback(
    async (e: React.FormEvent<HTMLDivElement>) => {
      e.preventDefault();

      try {
        if (!walletClient) throw new Error('Could not find a wallet client');
        if (!game) throw new Error('Missing game data');
        if (!selectedCharacter) throw new Error('Character not found');

        if (!gameOwner) throw new Error('Game owner not found');

        setIsApproving(true);

        const transactionhash = await walletClient.writeContract({
          chain: walletClient.chain,
          account: walletClient.account?.address as Address,
          address: game.id as Address,
          abi: parseAbi([
            'function approve(address to, uint256 characterId) public',
          ]),
          functionName: 'approve',
          args: [gameOwner, BigInt(selectedCharacter.characterId)],
        });
        setTxHash(transactionhash);

        const client = publicClient ?? walletClient;
        const { blockNumber, status } = await client.waitForTransactionReceipt({
          hash: transactionhash,
        });

        if (status === 'reverted') {
          setTxFailed(true);
          setIsApproving(false);
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
          `Something went wrong while approving character transfer`,
        );
      } finally {
        setIsSyncing(false);
        setIsApproving(false);
      }
    },
    [
      game,
      gameOwner,
      publicClient,
      reloadGame,
      renderError,
      selectedCharacter,
      walletClient,
    ],
  );

  const isLoading = isApproving;
  const isDisabled = isLoading;

  const content = () => {
    if (txFailed) {
      return (
        <VStack py={10} spacing={4}>
          <Text>Transaction failed.</Text>
          <Button onClick={approveTransferModal?.onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

    if (isSynced) {
      return (
        <VStack py={10} spacing={4}>
          <Text>Your character has been approved for transfer!</Text>
          <Button onClick={approveTransferModal?.onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

    if (txHash && selectedCharacter) {
      return (
        <TransactionPending
          isSyncing={isSyncing}
          text="Approving the transfer of your character..."
          txHash={txHash}
          chainId={game?.chainId}
        />
      );
    }

    return (
      <VStack as="form" onSubmit={onApproveTransfer} spacing={8}>
        <Text textAlign="center">
          By clicking approve, you are allowing the game owner (
          <Link
            alignItems="center"
            fontSize="sm"
            href={
              game && gameOwner ? getAddressUrl(game.chainId, gameOwner) : ''
            }
            isExternal
            textDecor="underline"
          >
            {gameOwner ? shortenAddress(gameOwner) : ''}
          </Link>
          ) to transfer your character to another player address.
        </Text>
        <Button
          autoFocus
          isDisabled={isDisabled}
          isLoading={isLoading}
          loadingText="Approving..."
          type="submit"
          variant="solid"
          alignSelf="flex-end"
        >
          Approve
        </Button>
      </VStack>
    );
  };

  return (
    <Modal
      closeOnEsc={!isLoading}
      closeOnOverlayClick={!isLoading}
      isOpen={approveTransferModal?.isOpen ?? false}
      onClose={approveTransferModal?.onClose ?? (() => {})}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Text>Approve Character Transfer</Text>
          <ModalCloseButton size="lg" />
        </ModalHeader>
        <ModalBody>{content()}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
