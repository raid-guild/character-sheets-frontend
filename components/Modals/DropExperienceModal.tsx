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
import { maxUint256, parseAbi } from 'viem';
import { Address, usePublicClient, useWalletClient } from 'wagmi';

import { TransactionPending } from '@/components/TransactionPending';
import { useGame } from '@/contexts/GameContext';
import { waitUntilBlock } from '@/hooks/useGraphHealth';

type DropExperienceModalProps = {
  characterAccount: Address;
  characterName: string;
  isOpen: boolean;
  onClose: () => void;
};

export const DropExperienceModal: React.FC<DropExperienceModalProps> = ({
  isOpen,
  onClose,
  characterAccount,
  characterName,
}) => {
  const { game, reload: reloadGame, isMaster } = useGame();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const toast = useToast();

  const [amount, setAmount] = useState<string>('');

  const [showError, setShowError] = useState<boolean>(false);
  const [isDropping, setIsDropping] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
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

  const resetData = useCallback(() => {
    setAmount('');
    setShowError(false);

    setIsDropping(false);
    setTxHash(null);
    setIsSyncing(false);
    setIsSynced(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetData();
    }
  }, [resetData, isOpen]);

  const onJoinCharacter = useCallback(
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

      if (!game?.itemsAddress) {
        toast({
          description: `Could not find the game.`,
          position: 'top',
          status: 'error',
        });
        console.error(`Missing game data.`);
        return;
      }

      if (!isMaster) {
        toast({
          description: `Not the game master.`,
          position: 'top',
          status: 'error',
        });
        console.error(`Not the game master.`);
        return;
      }

      setIsDropping(true);

      const characters = [characterAccount];
      const itemIds = [[BigInt(0)]];
      const amounts = [[BigInt(amount)]];

      try {
        const transactionhash = await walletClient.writeContract({
          chain: walletClient.chain,
          account: walletClient.account?.address as Address,
          address: game.itemsAddress as Address,
          abi: parseAbi([
            'function dropLoot(address[] calldata nftAddress, uint256[][] calldata itemIds, uint256[][] calldata amounts) external',
          ]),
          functionName: 'dropLoot',
          args: [characters, itemIds, amounts],
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
        toast({
          description: `You gave ${amount} XP to ${characterName}!`,
          position: 'top',
          status: 'success',
        });
        setIsSynced(true);
        reloadGame();
      } catch (e) {
        toast({
          description: `Something went wrong giving XP to ${characterName}.`,
          position: 'top',
          status: 'error',
        });
        console.error(e);
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
      characterAccount,
      characterName,
      reloadGame,
      toast,
      walletClient,
    ],
  );

  const isLoading = isDropping;
  const isDisabled = isLoading;

  const content = () => {
    // TODO: This isSynced check is unnecessary since the modal unmounts when the data is reloaded
    // We should move all action modals to a higher level component to avoid this
    if (isSynced) {
      return (
        <VStack py={10} spacing={4}>
          <Text>XP successfully given!</Text>
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
          text={`Giving ${amount} XP to ${characterName}...`}
          txHash={txHash}
        />
      );
    }

    return (
      <VStack as="form" onSubmit={onJoinCharacter} spacing={8}>
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
      isOpen={isOpen}
      onClose={onClose}
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
