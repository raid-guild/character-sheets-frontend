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
import { maxUint256, parseAbi } from 'viem';
import { Address, usePublicClient, useWalletClient } from 'wagmi';

import { TransactionPending } from '@/components/TransactionPending';
import { useCharacterActions } from '@/contexts/CharacterActionsContext';
import { useGame } from '@/contexts/GameContext';
import { waitUntilBlock } from '@/graphql/health';
import { useToast } from '@/hooks/useToast';

export const DropExperienceModal: React.FC = () => {
  const { game, reload: reloadGame, isMaster } = useGame();
  const { selectedCharacter, giveExpModal } = useCharacterActions();

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { renderError } = useToast();

  const [amount, setAmount] = useState<string>('');

  const [showError, setShowError] = useState<boolean>(false);
  const [isDropping, setIsDropping] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txFailed, setTxFailed] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSynced, setIsSynced] = useState<boolean>(false);

  const hasError = useMemo(
    () =>
      !amount ||
      BigInt(amount).toString() === 'NaN' ||
      BigInt(amount) <= BigInt(0) ||
      BigInt(amount) > maxUint256,
    [amount],
  );

  useEffect(() => {
    setShowError(false);
  }, [amount]);

  const resetData = useCallback(() => {
    setAmount('');
    setShowError(false);

    setIsDropping(false);
    setTxHash(null);
    setTxFailed(false);
    setIsSyncing(false);
    setIsSynced(false);
  }, []);

  useEffect(() => {
    if (!giveExpModal?.isOpen) {
      resetData();
    }
  }, [resetData, giveExpModal?.isOpen]);

  const onDropExp = useCallback(
    async (e: React.FormEvent<HTMLDivElement>) => {
      e.preventDefault();

      if (hasError) {
        setShowError(true);
        return;
      }

      try {
        if (!walletClient) throw new Error('Wallet client is not connected');
        if (!selectedCharacter) throw new Error('Character address not found');
        if (!game?.experienceAddress)
          throw new Error('Could not find the game');
        if (!isMaster) throw new Error('Not the game master');

        setIsDropping(true);

        const character = selectedCharacter.account as Address;
        const amountBG = BigInt(amount);

        const transactionhash = await walletClient.writeContract({
          chain: walletClient.chain,
          account: walletClient.account?.address as Address,
          address: game.experienceAddress as Address,
          abi: parseAbi([
            'function dropExp(address character, uint256 amount) public',
          ]),
          functionName: 'dropExp',
          args: [character, amountBG],
        });
        setTxHash(transactionhash);

        const client = publicClient ?? walletClient;
        const { blockNumber, status } = await client.waitForTransactionReceipt({
          hash: transactionhash,
        });

        if (status === 'reverted') {
          setTxFailed(true);
          setIsDropping(false);
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
          `Something went wrong giving XP to ${selectedCharacter?.name}`,
        );
      } finally {
        setIsSyncing(false);
        setIsDropping(false);
      }
    },
    [
      amount,
      isMaster,
      hasError,
      publicClient,
      game,
      reloadGame,
      renderError,
      selectedCharacter,
      walletClient,
    ],
  );

  const isLoading = isDropping;
  const isDisabled = isLoading;

  const content = () => {
    if (txFailed) {
      return (
        <VStack py={10} spacing={4}>
          <Text>Transaction failed.</Text>
          <Button onClick={giveExpModal?.onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

    if (isSynced) {
      return (
        <VStack py={10} spacing={4}>
          <Text>XP successfully given!</Text>
          <Button onClick={giveExpModal?.onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

    if (txHash && selectedCharacter) {
      return (
        <TransactionPending
          isSyncing={isSyncing}
          text={`Giving ${amount} XP to ${selectedCharacter.name}...`}
          txHash={txHash}
          chainId={game?.chainId}
        />
      );
    }

    return (
      <VStack as="form" onSubmit={onDropExp} spacing={8}>
        <FormControl isInvalid={showError}>
          <FormLabel>Amount</FormLabel>
          <Input
            onChange={e => setAmount(e.target.value)}
            type="number"
            value={amount}
          />
          {showError && (
            <FormHelperText color="red">
              Please enter a valid amount
            </FormHelperText>
          )}
        </FormControl>
        <Button
          alignSelf="flex-end"
          isDisabled={isDisabled}
          isLoading={isLoading}
          loadingText="Giving..."
          type="submit"
        >
          Give
        </Button>
      </VStack>
    );
  };

  return (
    <Modal
      closeOnEsc={!isLoading}
      closeOnOverlayClick={!isLoading}
      isOpen={giveExpModal?.isOpen ?? false}
      onClose={giveExpModal?.onClose ?? (() => {})}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Text>Give XP</Text>
          <ModalCloseButton size="lg" />
        </ModalHeader>
        <ModalBody>{content()}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
