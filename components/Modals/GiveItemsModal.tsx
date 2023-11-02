import {
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  useRadioGroup,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { parseAbi } from 'viem';
import { Address, usePublicClient, useWalletClient } from 'wagmi';

import { RadioCard } from '@/components/RadioCard';
import { TransactionPending } from '@/components/TransactionPending';
import { useActions } from '@/contexts/ActionsContext';
import { useGame } from '@/contexts/GameContext';
import { waitUntilBlock } from '@/hooks/useGraphHealth';
import { useToast } from '@/hooks/useToast';

export const GiveItemsModal: React.FC = () => {
  const { game, reload: reloadGame, isMaster } = useGame();
  const { selectedCharacter, giveItemsModal } = useActions();

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { renderError } = useToast();

  const [itemId, setItemId] = useState<string>('0');
  const [amount, setAmount] = useState<string>('');

  const [showError, setShowError] = useState<boolean>(false);
  const [isGiving, setIsGiving] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txFailed, setTxFailed] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSynced, setIsSynced] = useState<boolean>(false);

  const selectedItem = useMemo(() => {
    const item = game?.items.find(c => c.itemId === itemId);
    if (!item) return null;
    return item;
  }, [game?.items, itemId]);

  const hasError = useMemo(
    () =>
      !amount ||
      BigInt(amount).toString() === 'NaN' ||
      BigInt(amount) <= BigInt(0) ||
      BigInt(amount) > BigInt(selectedItem?.supply || '0'),
    [amount, selectedItem],
  );

  useEffect(() => {
    setShowError(false);
  }, [amount, itemId]);

  const invalidItem = useMemo(() => {
    if (!selectedItem) return false;
    const supply = Number(selectedItem.supply);
    if (Number.isNaN(supply) || supply <= 0) return true;
    return false;
  }, [selectedItem]);

  const options = game?.items.map(c => c.itemId) ?? [];
  const { getRootProps, getRadioProps, setValue } = useRadioGroup({
    name: 'item',
    defaultValue: '0',
    onChange: setItemId,
  });
  const group = getRootProps();

  const resetData = useCallback(() => {
    setAmount('');
    setValue('0');
    setItemId('0');
    setIsGiving(false);
    setTxHash(null);
    setTxFailed(false);
    setIsSyncing(false);
    setIsSynced(false);
  }, [setValue]);

  useEffect(() => {
    if (!giveItemsModal?.isOpen) {
      resetData();
    }
  }, [resetData, giveItemsModal?.isOpen]);

  const onGiveItems = useCallback(
    async (e: React.FormEvent<HTMLDivElement>) => {
      e.preventDefault();

      if (invalidItem) {
        return;
      }

      if (hasError) {
        setShowError(true);
        return;
      }

      try {
        if (!walletClient) throw new Error('Wallet client is not connected');
        if (!selectedCharacter) throw new Error('Character address not found');
        if (!game?.itemsAddress) throw new Error('Missing game data');
        if (game?.items.length === 0) throw new Error('No items found');
        if (!isMaster) throw new Error('Not the game master');

        setIsGiving(true);

        const characters = [selectedCharacter.account as Address];
        const itemIds = [[BigInt(itemId)]];
        const amounts = [[BigInt(amount)]];

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
        const { blockNumber, status } = await client.waitForTransactionReceipt({
          hash: transactionhash,
        });

        if (status === 'reverted') {
          setTxFailed(true);
          setIsGiving(false);
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
          `Something went wrong giving item(s) to ${selectedCharacter?.name}`,
        );
      } finally {
        setIsSyncing(false);
        setIsGiving(false);
      }
    },
    [
      hasError,
      amount,
      itemId,
      isMaster,
      invalidItem,
      publicClient,
      game,
      reloadGame,
      renderError,
      selectedCharacter,
      walletClient,
    ],
  );

  const isLoading = isGiving;
  const isDisabled = isLoading || invalidItem;

  const content = () => {
    if (txFailed) {
      return (
        <VStack py={10} spacing={4}>
          <Text>Transaction failed.</Text>
          <Button onClick={giveItemsModal?.onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

    if (isSynced) {
      return (
        <VStack py={10} spacing={4}>
          <Text>Item(s) successfully given!</Text>
          <Button onClick={giveItemsModal?.onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

    if (txHash && selectedCharacter) {
      return (
        <TransactionPending
          isSyncing={isSyncing}
          text={`Giving the item(s) to ${selectedCharacter.name}...`}
          txHash={txHash}
        />
      );
    }

    return (
      <VStack as="form" onSubmit={onGiveItems} spacing={8}>
        <Flex {...group} wrap="wrap" gap={4}>
          {options.map(value => {
            const radio = getRadioProps({ value });
            const item = game?.items.find(c => c.itemId === value);
            if (!item) return null;

            return (
              <RadioCard key={value} {...radio}>
                <VStack justify="space-between" h="100%">
                  <Image
                    alt={`${item.name} image`}
                    h="55%"
                    objectFit="contain"
                    src={item.image}
                    w="100%"
                  />
                  <Text textAlign="center">{item.name}</Text>
                  <Text fontSize="xs">
                    Supply:{' '}
                    {`${item.supply.toString()} / ${item.totalSupply.toString()}`}
                  </Text>
                </VStack>
              </RadioCard>
            );
          })}
        </Flex>
        {invalidItem ? (
          <Text color="red.500">This item has zero supply.</Text>
        ) : (
          <FormControl isInvalid={showError}>
            <FormLabel>Amount</FormLabel>
            <Input
              onChange={e => setAmount(e.target.value)}
              type="number"
              value={amount}
            />
            {showError && (
              <FormHelperText color="red">
                Please enter a valid amount. Item supply is{' '}
                {selectedItem?.supply.toString()}.
              </FormHelperText>
            )}
          </FormControl>
        )}
        <Button
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
      isOpen={giveItemsModal?.isOpen ?? false}
      onClose={giveItemsModal?.onClose ?? (() => {})}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Text>Give items</Text>
          <ModalCloseButton size="lg" />
        </ModalHeader>
        <ModalBody>{content()}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
