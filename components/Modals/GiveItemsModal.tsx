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
  useToast,
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

export const GiveItemsModal: React.FC = () => {
  const { game, reload: reloadGame, isMaster } = useGame();
  const { selectedCharacter, giveItemsModal } = useActions();

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const toast = useToast();

  const [itemId, setItemId] = useState<string>('1');
  const [amount, setAmount] = useState<string>('');

  const [showError, setShowError] = useState<boolean>(false);
  const [isGiving, setIsGiving] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
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
    defaultValue: '1',
    onChange: setItemId,
  });
  const group = getRootProps();

  const resetData = useCallback(() => {
    setAmount('');
    setValue('1');
    setItemId('1');
    setIsGiving(false);
    setTxHash(null);
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

      if (!walletClient) {
        toast({
          description: 'Wallet client is not connected.',
          position: 'top',
          status: 'error',
        });
        console.error('Could not find a wallet client.');
        return;
      }

      if (!selectedCharacter) {
        toast({
          description: 'Character address not found.',
          position: 'top',
          status: 'error',
        });
        console.error('Character address not found.');
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

      if (game?.items.length === 0) {
        toast({
          description: `No items found.`,
          position: 'top',
          status: 'error',
        });
        console.error(`No items found.`);
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

      setIsGiving(true);

      try {
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
          description: `Something went wrong giving item(s) to ${selectedCharacter.name}.`,
          position: 'top',
          status: 'error',
        });
        console.error(e);
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
      selectedCharacter,
      toast,
      walletClient,
    ],
  );

  const isLoading = isGiving;
  const isDisabled = isLoading || invalidItem;

  const content = () => {
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
                    Supply: {`${item.supply} / ${item.totalSupply}`}
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
                {selectedItem?.supply}.
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
