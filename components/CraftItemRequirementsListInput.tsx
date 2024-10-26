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
import { CraftRequirement, Item } from '@/utils/types';

import { MultiSourceImage } from './MultiSourceImage';
import { SelectItemInput } from './SelectItemInput';

type Props = {
  craftRequirementsList: Array<CraftRequirement>;
  setCraftRequirementsList: React.Dispatch<
    React.SetStateAction<Array<CraftRequirement>>
  >;
};

export const CraftItemRequirementsListInput: React.FC<Props> = ({
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
    const map = new Map<string, Item>();
    items.forEach(c => map.set(c.itemId, c));
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
        <Text>You must connect your wallet to add items</Text>
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
              item={itemMap.get(requirementsList[i].itemId.toString())}
              removeCraftRequirement={removeCraftItemRequirement}
              index={i}
              chainId={chainId}
            />
          ))}
      </VStack>
    </VStack>
  );
};

type DisplayProps = {
  craftItem: CraftRequirement;
  item: Item | undefined;
  removeCraftRequirement: (index: number) => void;
  index: number;
  chainId: number;
};

const CraftItemRequirementDisplay: React.FC<DisplayProps> = ({
  craftItem,
  item,
  removeCraftRequirement,
  index: i,
}) => {
  const { amount } = craftItem;

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
          <MultiSourceImage
            alt={`${item?.name} image`}
            h="40px"
            objectFit="contain"
            src={item?.image}
            w="40px"
          />
          <Text fontWeight="bold">{item?.name}</Text>
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
          onClick={() => removeCraftRequirement(i)}
        />
      </Grid>
    </VStack>
  );
};

type InputProps = {
  items: Item[];
  requirementsList: Array<CraftRequirement>;
  setRequirementsList: React.Dispatch<
    React.SetStateAction<Array<CraftRequirement>>
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
        itemId: BigInt(selectedItem.itemId).toString(),
        amount: BigInt(amount).toString(),
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
            items={items.filter(i => !i.soulbound)}
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            noItemsText="No transferable items available"
          />
          <Tooltip
            label={items.length === 0 ? 'No transferable items available' : ''}
          >
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
      <Tooltip
        label={items.length === 0 ? 'No transferable items available' : ''}
      >
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
