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
  VStack,
} from '@chakra-ui/react';

import { shortenText } from '@/utils/helpers';
import { Item } from '@/utils/types';

type ItemCardProps = Item & {
  chainId: number;
  isMaster: boolean;
};

export const ItemCard: React.FC<ItemCardProps> = ({ isMaster, ...item }) => {
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
        <Button size="sm">View</Button>
        <ActionMenu isMaster={isMaster} />
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
          Supply: {supply} / {totalSupply}
        </Text>
        <Text>Held By: {holders.length}</Text>
        <Text>Equipped By: {equippers.length}</Text>
      </VStack>
    </HStack>
  );
};

export const SmallItemCard: React.FC<ItemCardProps> = ({
  isMaster,
  ...item
}) => {
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
        <Button size="sm">View</Button>
        <ActionMenu isMaster={isMaster} />
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
          Supply: {supply} / {totalSupply}
        </Text>
        <Text fontSize="xs">Held By: {holders.length}</Text>
        <Text fontSize="xs">Equipped By: {equippers.length}</Text>
      </VStack>
    </HStack>
  );
};

type ActionMenuProps = {
  isMaster: boolean;
};

const ActionMenu: React.FC<ActionMenuProps> = ({ isMaster }) => {
  return (
    <Menu>
      <MenuButton as={Button} size="sm">
        Actions
      </MenuButton>
      <MenuList>
        <Text
          borderBottom="1px solid black"
          fontSize="12px"
          p={3}
          textAlign="center"
          variant="heading"
        >
          Player Actions
        </Text>
        {/* TODO: Check if held by character */}
        <MenuItem>Equip</MenuItem>
        {isMaster && (
          <>
            <Text
              borderBottom="1px solid black"
              borderTop="3px solid black"
              fontSize="12px"
              p={3}
              textAlign="center"
              variant="heading"
            >
              GameMaster Actions
            </Text>
            <MenuItem>Edit Item</MenuItem>
            <MenuItem>Assign Item</MenuItem>
          </>
        )}
      </MenuList>
    </Menu>
  );
};
