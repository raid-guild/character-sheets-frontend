import { CloseIcon } from '@chakra-ui/icons';
import {
  Button,
  FormControl,
  FormHelperText,
  Grid,
  HStack,
  Input,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';

import { useGame } from '@/contexts/GameContext';
import { Item } from '@/utils/types';

import { SelectItemInput } from './SelectItemInput';

export type CraftItemRequirement = {
  itemId: bigint;
  amount: bigint;
};

type Props = {
  craftRequirementsList: Array<CraftItemRequirement>;
  setCraftRequirementsList: React.Dispatch<
    React.SetStateAction<Array<CraftItemRequirement>>
  >;
};

export const CraftItemRequirementListInput: React.FC<Props> = ({
  craftRequirementsList: requirementsList,
  setCraftRequirementsList: setRequirementsList,
}) => {
  const { game } = useGame();
  const { chain } = useAccount();

  const { items, chainId } = game || {
    items: [],
    chainId: chain?.id,
  };

  const itemMap = useMemo(() => {
    const map = new Map<string, string>();
    items.forEach(c => map.set(c.itemId, c.name));
    return map;
  }, [items]);

  const removeCraftItemRequirement = useCallback(
    (index: number) => {
      const newCraftItemRequirementList = requirementsList.slice();
      newCraftItemRequirementList.splice(index, 1);
      setRequirementsList(newCraftItemRequirementList);
    },
    [requirementsList, setRequirementsList],
  );

  const itemsNotSelected = useMemo(() => {
    const selectedAddresses = new Set(
      requirementsList.map(c => c.itemId.toString()),
    );
    return items.filter(c => !selectedAddresses.has(c.itemId));
  }, [requirementsList, items]);

  if (!chainId) {
    return (
      <VStack align="stretch" spacing={4} w="100%">
        <Text>You must connect your wallet to add claimers.</Text>
      </VStack>
    );
  }

  return (
    <VStack align="stretch" spacing={4} w="100%">
      <CraftItemRequirementInput
        items={itemsNotSelected}
        requirementsList={requirementsList}
        setRequirementsList={setRequirementsList}
      />
      <VStack spacing={2} w="100%">
        {Array(requirementsList.length)
          .fill(0)
          .map((v, i) => (
            <CraftItemRequirementDisplay
              key={v.toString() + i.toString()}
              craftItem={requirementsList[i]}
              itemName={itemMap.get(requirementsList[i].itemId.toString())}
              removeCraftItemRequirement={removeCraftItemRequirement}
              index={i}
              chainId={chainId}
            />
          ))}
      </VStack>
    </VStack>
  );
};

type DisplayProps = {
  craftItem: CraftItemRequirement;
  itemName: string | undefined;
  removeCraftItemRequirement: (index: number) => void;
  index: number;
  chainId: number;
};

const CraftItemRequirementDisplay: React.FC<DisplayProps> = ({
  craftItem,
  itemName,
  removeCraftItemRequirement,
  index: i,
}) => {
  const { itemId, amount } = craftItem;

  return (
    <VStack spacing={4} w="100%" mb={4}>
      <Grid
        w="100%"
        templateColumns={{
          base: '2fr 1.5fr',
          sm: '3fr 1.5fr',
          md: '3fr 1fr',
        }}
        gridGap={4}
        position="relative"
      >
        <HStack spacing={2}>
          <Text fontWeight="bold">{itemName}</Text>
          <Text color="whiteAlpha.400">( Item ID: {itemId.toString()} )</Text>
        </HStack>
        <Text>{amount.toString()}</Text>
        <CloseIcon
          position="absolute"
          right="0"
          top="50%"
          transform="translateY(-50%)"
          cursor="pointer"
          transition="0.25s"
          color="whiteAlpha.400"
          _hover={{ color: 'white' }}
          onClick={() => removeCraftItemRequirement(i)}
        />
      </Grid>
    </VStack>
  );
};

type InputProps = {
  items: Item[];
  requirementsList: Array<CraftItemRequirement>;
  setRequirementsList: React.Dispatch<
    React.SetStateAction<Array<CraftItemRequirement>>
  >;
};

const CraftItemRequirementInput: React.FC<InputProps> = ({
  items,
  setRequirementsList,
}) => {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const itemSupply = selectedItem?.supply || '0';
  const itemDistribution = selectedItem?.distribution || '0';

  const [amount, setAmount] = useState<string>('');
  const [showError, setShowError] = useState<boolean>(false);

  const amountInvalid = useMemo(
    () => !amount || Number.isNaN(Number(amount)) || amount === '0',
    [amount],
  );

  const moreThanSupply = useMemo(() => {
    if (BigInt(amount) > BigInt(itemSupply)) {
      return true;
    }
    return false;
  }, [amount, itemSupply]);

  const moreThanDistribution = useMemo(() => {
    if (BigInt(amount) > BigInt(itemDistribution)) {
      return true;
    }
    return false;
  }, [amount, itemDistribution]);

  useEffect(() => {
    setShowError(false);
  }, [selectedItem, amount]);

  const errorText = useMemo(() => {
    if (!selectedItem && amountInvalid) {
      return 'Item and amount are invalid';
    }
    if (!selectedItem && !amountInvalid) {
      return 'Item is invalid';
    }
    if (selectedItem && amountInvalid) {
      return 'Amount is invalid';
    }
    if (!!selectedItem && moreThanSupply) {
      return 'Amount exceeds item supply';
    }
    if (!!selectedItem && moreThanDistribution) {
      return 'Amount exceeds item distribution';
    }
    return '';
  }, [selectedItem, amountInvalid, moreThanSupply, moreThanDistribution]);

  const onAddCraftItemRequirement = useCallback(() => {
    if (
      !selectedItem ||
      amountInvalid ||
      moreThanSupply ||
      moreThanDistribution
    ) {
      setShowError(true);
      return;
    }

    setRequirementsList(oldList => [
      ...oldList,
      {
        itemId: BigInt(selectedItem.itemId),
        amount: BigInt(amount),
      },
    ]);
    setSelectedItem(null);
    setAmount('');
    setShowError(false);
  }, [
    amount,
    selectedItem,
    amountInvalid,
    moreThanSupply,
    moreThanDistribution,
    setRequirementsList,
  ]);

  return (
    <VStack spacing={4} w="100%" mb={4}>
      <FormControl>
        <Grid
          w="100%"
          templateColumns={{
            base: '1fr',
            sm: '3fr 1.5fr',
            md: '3fr 1fr',
          }}
          gridGap={4}
          position="relative"
          justifyContent="center"
          alignItems="center"
        >
          <SelectItemInput
            items={items}
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
          />
          <Tooltip label={items.length === 0 ? 'No items available' : ''}>
            <Input
              type="number"
              step={1}
              min={0}
              placeholder="Amount"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              isInvalid={amountInvalid && showError}
              isDisabled={items.length === 0}
              h="2.7125rem"
            />
          </Tooltip>
        </Grid>
        {showError && (
          <FormHelperText color="red.500">{errorText}</FormHelperText>
        )}
      </FormControl>
      <Tooltip label={items.length === 0 ? 'No items available' : ''}>
        <Button
          variant="outline"
          size="sm"
          onClick={onAddCraftItemRequirement}
          isDisabled={items.length === 0}
        >
          Add Item
        </Button>
      </Tooltip>
    </VStack>
  );
};
