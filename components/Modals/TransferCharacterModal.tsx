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
  VStack,
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { isAddress, parseAbi } from 'viem';
import { Address, usePublicClient, useWalletClient } from 'wagmi';

import { TransactionPending } from '@/components/TransactionPending';
import { useActions } from '@/contexts/ActionsContext';
import { useGame } from '@/contexts/GameContext';
import { waitUntilBlock } from '@/hooks/useGraphHealth';
import { useToast } from '@/hooks/useToast';

export const TransferCharacterModal: React.FC = () => {
  const { game, reload: reloadGame } = useGame();
  const { selectedCharacter, transferCharacterModal } = useActions();

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { renderError } = useToast();

  const [newPlayer, setNewPlayer] = useState<string>('');

  const [showError, setShowError] = useState<boolean>(false);
  const [isTransferring, setIsTransferring] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txFailed, setTxFailed] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSynced, setIsSynced] = useState<boolean>(false);

  const invalidPlayerAddress = useMemo(() => {
    return !isAddress(newPlayer) && !!newPlayer;
  }, [newPlayer]);

  const allPlayers = useMemo(() => {
    if (!game) return [];
    return game.characters.map(c => c.player);
  }, [game]);

  const newPlayerIsAlreadyPlayer = useMemo(() => {
    return allPlayers.includes(newPlayer.toLowerCase());
  }, [allPlayers, newPlayer]);

  const hasError = useMemo(() => {
    return !newPlayer || invalidPlayerAddress || newPlayerIsAlreadyPlayer;
  }, [newPlayer, invalidPlayerAddress, newPlayerIsAlreadyPlayer]);

  useEffect(() => {
    setShowError(false);
  }, [newPlayer]);

  const resetData = useCallback(() => {
    setNewPlayer('');

    setShowError(false);
    setIsTransferring(false);
    setTxHash(null);
    setTxFailed(false);
    setIsSyncing(false);
    setIsSynced(false);
  }, []);

  useEffect(() => {
    if (!transferCharacterModal?.isOpen) {
      resetData();
    }
  }, [resetData, transferCharacterModal?.isOpen]);

  const gameOwner = useMemo(() => {
    if (!game) return null;
    return game.owner as Address;
  }, [game]);

  const onTransferCharacter = useCallback(
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

        if (!gameOwner) throw new Error('Game owner not found');

        setIsTransferring(true);

        const transactionhash = await walletClient.writeContract({
          chain: walletClient.chain,
          account: walletClient.account?.address as Address,
          address: game.id as Address,
          abi: parseAbi([
            'function transferFrom(address from, address to, uint256 characterId) public',
          ]),
          functionName: 'transferFrom',
          args: [
            selectedCharacter.player as Address,
            newPlayer as Address,
            BigInt(selectedCharacter.characterId),
          ],
        });
        setTxHash(transactionhash);

        const client = publicClient ?? walletClient;
        const { blockNumber, status } = await client.waitForTransactionReceipt({
          hash: transactionhash,
        });

        if (status === 'reverted') {
          setTxFailed(true);
          setIsTransferring(false);
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
          `Something went wrong while transferring character to a new player`,
        );
      } finally {
        setIsSyncing(false);
        setIsTransferring(false);
      }
    },
    [
      game,
      gameOwner,
      hasError,
      newPlayer,
      publicClient,
      reloadGame,
      renderError,
      selectedCharacter,
      walletClient,
    ],
  );

  const isLoading = isTransferring;
  const isDisabled = isLoading;

  const content = () => {
    if (txFailed) {
      return (
        <VStack py={10} spacing={4}>
          <Text>Transaction failed.</Text>
          <Button onClick={transferCharacterModal?.onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

    if (isSynced) {
      return (
        <VStack py={10} spacing={4}>
          <Text>
            The character {selectedCharacter?.name} has been transferred to a
            new player!
          </Text>
          <Button onClick={transferCharacterModal?.onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

    if (txHash && selectedCharacter) {
      return (
        <TransactionPending
          isSyncing={isSyncing}
          text="Transferring character..."
          txHash={txHash}
        />
      );
    }

    return (
      <VStack as="form" onSubmit={onTransferCharacter} spacing={8}>
        <FormControl isInvalid={showError && invalidPlayerAddress}>
          <FormLabel>New player address</FormLabel>
          <Input
            onChange={e => setNewPlayer(e.target.value)}
            type="text"
            value={newPlayer}
          />
          {showError && !newPlayer && (
            <FormHelperText color="red">
              New player address is required
            </FormHelperText>
          )}
          {showError && invalidPlayerAddress && (
            <FormHelperText color="red">Invalid player address</FormHelperText>
          )}
          {showError && !invalidPlayerAddress && newPlayerIsAlreadyPlayer && (
            <FormHelperText color="red">
              This player already owns a character in this game
            </FormHelperText>
          )}
        </FormControl>
        <Button
          autoFocus
          isDisabled={isDisabled}
          isLoading={isLoading}
          loadingText="Transferring..."
          type="submit"
        >
          Transfer
        </Button>
      </VStack>
    );
  };

  return (
    <Modal
      closeOnEsc={!isLoading}
      closeOnOverlayClick={!isLoading}
      isOpen={transferCharacterModal?.isOpen ?? false}
      onClose={transferCharacterModal?.onClose ?? (() => {})}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Text>Transfer Character to New Player</Text>
          <ModalCloseButton size="lg" />
        </ModalHeader>
        <ModalBody>{content()}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
