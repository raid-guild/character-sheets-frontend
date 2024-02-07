import {
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Image,
  Input,
  Text,
  useRadioGroup,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Address, parseAbi } from 'viem';
import { useWalletClient } from 'wagmi';

import { RadioCard } from '@/components/RadioCard';
import { useCharacterActions } from '@/contexts/CharacterActionsContext';
import { useGame } from '@/contexts/GameContext';

import { ActionModal } from './ActionModal';

export const GiveItemsModal: React.FC = () => {
  const { game, reload: reloadGame, isMaster } = useGame();
  const { selectedCharacter, giveItemsModal } = useCharacterActions();

  const { data: walletClient } = useWalletClient();

  const [itemId, setItemId] = useState<string>('0');
  const [amount, setAmount] = useState<string>('');

  const [showError, setShowError] = useState<boolean>(false);
  const [isGiving, setIsGiving] = useState<boolean>(false);

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
  }, [setValue]);

  const onGiveItems = useCallback(async () => {
    if (invalidItem) {
      return null;
    }

    if (hasError) {
      setShowError(true);
      return null;
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
      return transactionhash;
    } catch (e) {
      throw e;
    } finally {
      setIsGiving(false);
    }
  }, [
    hasError,
    amount,
    itemId,
    isMaster,
    invalidItem,
    game,
    selectedCharacter,
    walletClient,
  ]);

  const isLoading = isGiving;
  const isDisabled = isLoading || invalidItem;

  return (
    <ActionModal
      {...{
        isOpen: giveItemsModal?.isOpen,
        onClose: giveItemsModal?.onClose,
        header: `Give item(s) to ${selectedCharacter?.name}`,
        loadingText: `Giving item(s) to ${selectedCharacter?.name}...`,
        successText: `Item(s) successfully given to ${selectedCharacter?.name}!`,
        errorText: `There was an error giving the item(s) to ${selectedCharacter?.name}.`,
        resetData,
        onAction: onGiveItems,
        onComplete: reloadGame,
      }}
    >
      <VStack spacing={8}>
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
          alignSelf="flex-end"
          variant="solid"
        >
          Give
        </Button>
      </VStack>
    </ActionModal>
  );
};
