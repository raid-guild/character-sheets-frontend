import {
  Box,
  Button,
  HStack,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  useToast,
  VStack,
} from '@chakra-ui/react';

import { PlayerActions, useActions } from '@/contexts/ActionsContext';
import { useGame } from '@/contexts/GameContext';
import { shortenText } from '@/utils/helpers';
import { Item } from '@/utils/types';

type ItemCardProps = Item & {
  chainId: number;
  isMaster: boolean;
};

export const ItemCard: React.FC<ItemCardProps> = ({ isMaster, ...item }) => {
  const toast = useToast();

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
      border="3px solid black"
      borderBottom="5px solid black"
      borderRight="5px solid black"
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
        <ActionMenu isMaster={isMaster} item={item} />
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

        <Box background="black" h="3px" my={4} w={20} />
        <Text>
          Supply: {supply.toString()} / {totalSupply.toString()}
        </Text>
        <Text>Held By: {holdersDisplay}</Text>
        <Text>Equipped By: {equippersDisplay}</Text>
      </VStack>
    </HStack>
  );
};

export const SmallItemCard: React.FC<ItemCardProps> = ({
  isMaster,
  ...item
}) => {
  const toast = useToast();

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
      border="3px solid black"
      borderBottom="5px solid black"
      borderRight="5px solid black"
      transition="background 0.3s ease"
      p={4}
      spacing={8}
      w="100%"
    >
      <VStack align="center" h="100%" w="35%">
        <Image alt="item emblem" h="60%" objectFit="cover" src={image} />
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
        <ActionMenu isMaster={isMaster} item={item} />
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

        <Box background="black" h="3px" my={4} w={20} />
        <Text fontSize="xs">
          Supply: {supply.toString()} / {totalSupply.toString()}
        </Text>
        <Text fontSize="xs">Held By: {holdersDisplay}</Text>
        <Text fontSize="xs">Equipped By: {equippersDisplay}</Text>
      </VStack>
    </HStack>
  );
};

type ActionMenuProps = {
  isMaster: boolean;
  item: Item;
};

const ActionMenu: React.FC<ActionMenuProps> = ({ isMaster, item }) => {
  const toast = useToast();
  const { selectItem, selectCharacter, openActionModal } = useActions();
  const { character } = useGame();

  const isHeld =
    character?.heldItems.find(h => h.itemId === item.itemId) !== undefined;
  const isEquipped =
    character?.equippedItems.find(e => e.itemId === item.itemId) !== undefined;

  return (
    <Menu
      onOpen={() => {
        selectItem(item);
        if (character) {
          selectCharacter(character);
        }
      }}
    >
      <MenuButton as={Button} size="sm">
        Actions
      </MenuButton>
      <MenuList>
        {isHeld && (
          <>
            <Text
              borderBottom="1px solid black"
              fontSize="12px"
              p={3}
              textAlign="center"
              variant="heading"
            >
              Player Actions
            </Text>
            <MenuItem onClick={() => openActionModal(PlayerActions.EQUIP_ITEM)}>
              {isEquipped ? 'Unequip Item' : 'Equip'}
            </MenuItem>
          </>
        )}
        {isMaster && (
          <>
            <Text
              borderBottom="1px solid black"
              borderTop={isHeld ? '3px solid black' : 'none'}
              fontSize="12px"
              p={3}
              textAlign="center"
              variant="heading"
            >
              GameMaster Actions
            </Text>
            <MenuItem
              onClick={() => {
                toast({
                  title: 'Coming soon!',
                  position: 'top',
                  status: 'warning',
                });
              }}
            >
              Edit Item
            </MenuItem>
            <MenuItem
              onClick={() => {
                toast({
                  title: 'Coming soon!',
                  position: 'top',
                  status: 'warning',
                });
              }}
            >
              Assign Item
            </MenuItem>
          </>
        )}
      </MenuList>
    </Menu>
  );
};
