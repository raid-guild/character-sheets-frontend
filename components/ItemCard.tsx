import {
  Box,
  Button,
  HStack,
  Image,
  Text,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { useAccount } from 'wagmi';

import { ItemActionMenu } from '@/components/ActionMenus/ItemActionMenu';
import { useGame } from '@/contexts/GameContext';
import { shortenText } from '@/utils/helpers';
import { Item } from '@/utils/types';

type ItemCardProps = Item & {
  chainId: number;
};

export const ItemCard: React.FC<ItemCardProps> = ({ ...item }) => {
  const toast = useToast();
  const { isConnected } = useAccount();

  const {
    itemId,
    name,
    description,
    image,
    supply,
    totalSupply,
    holders,
    equippers,
  } = item;

  const { character } = useGame();

  const isHeld =
    character?.heldItems.find(h => h.itemId === item.itemId) !== undefined;
  const isEquipped =
    character?.equippedItems.find(e => e.itemId === item.itemId) !== undefined;

  const holdersDisplay = isHeld
    ? holders.length === 1
      ? 'you'
      : `you and ${holders.length - 1} others`
    : holders.length;
  const equippersDisplay = isEquipped
    ? equippers.length === 1
      ? 'you'
      : `you and ${equippers.length - 1} others`
    : equippers.length;

  return (
    <HStack
      border="3px solid white"
      borderBottom="5px solid white"
      borderRight="5px solid white"
      h="300px"
      transition="background 0.3s ease"
      p={4}
      w="100%"
    >
      <VStack w="30%">
        <Image
          alt="item emblem"
          h="140px"
          objectFit="cover"
          src={image}
          w="100px"
        />
        <VStack align="stretch" w="120px">
          <Button
            onClick={() => {
              toast({
                title: 'Coming soon!',
                position: 'top',
                status: 'warning',
              });
            }}
            size="sm"
          >
            View
          </Button>
          {isConnected && <ItemActionMenu item={item} />}
        </VStack>
      </VStack>
      <VStack align="flex-start">
        <Text fontSize="lg" fontWeight="bold">
          {name}
        </Text>
        <Text>
          Description:{' '}
          <Text as="span" fontSize="xs">
            {shortenText(description, 130)}
          </Text>
        </Text>
        <Text>
          Item ID:{' '}
          <Text as="span" fontSize="xs">
            {itemId}
          </Text>
        </Text>

        <Box background="white" h="3px" my={4} w={20} />
        <Text>
          Supply: {supply.toString()} / {totalSupply.toString()}
        </Text>
        <Text>Held By: {holdersDisplay}</Text>
        <Text>Equipped By: {equippersDisplay}</Text>
      </VStack>
    </HStack>
  );
};

export const SmallItemCard: React.FC<ItemCardProps> = ({ ...item }) => {
  const toast = useToast();
  const { isConnected } = useAccount();

  const {
    itemId,
    name,
    description,
    image,
    supply,
    totalSupply,
    holders,
    equippers,
  } = item;

  const { character } = useGame();

  const isHeld =
    character?.heldItems.find(h => h.itemId === item.itemId) !== undefined;
  const isEquipped =
    character?.equippedItems.find(e => e.itemId === item.itemId) !== undefined;

  const holdersDisplay = isHeld
    ? holders.length === 1
      ? 'you'
      : `you and ${holders.length - 1} others`
    : holders.length;
  const equippersDisplay = isEquipped
    ? equippers.length === 1
      ? 'you'
      : `you and ${equippers.length - 1} others`
    : equippers.length;

  return (
    <HStack
      border="3px solid white"
      borderBottom="5px solid white"
      borderRight="5px solid white"
      transition="background 0.3s ease"
      p={4}
      spacing={8}
      w="100%"
    >
      <VStack align="center" h="100%" w="35%">
        <Image alt="item emblem" h="60%" objectFit="cover" src={image} />
        <VStack align="stretch" w="100px">
          <Button
            onClick={() => {
              toast({
                title: 'Coming soon!',
                position: 'top',
                status: 'warning',
              });
            }}
            size="sm"
            w="100%"
          >
            View
          </Button>
          {isConnected && <ItemActionMenu item={item} />}
        </VStack>
      </VStack>
      <VStack align="flex-start">
        <Text fontSize="md" fontWeight="bold">
          {name}
        </Text>
        <Text fontSize="xs">{shortenText(description, 130)}</Text>
        <Text fontSize="xs">
          Item ID:{' '}
          <Text as="span" fontSize="xs">
            {itemId}
          </Text>
        </Text>

        <Box background="white" h="3px" my={4} w={20} />
        <Text fontSize="xs">
          Supply: {supply.toString()} / {totalSupply.toString()}
        </Text>
        <Text fontSize="xs">Held By: {holdersDisplay}</Text>
        <Text fontSize="xs">Equipped By: {equippersDisplay}</Text>
      </VStack>
    </HStack>
  );
};
