import { ChevronDownIcon } from '@chakra-ui/icons';
import {
  Button,
  HStack,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  Tooltip,
} from '@chakra-ui/react';

import { Item } from '@/utils/types';

type SelectItemInputProps = {
  selectedItem: Item | null;
  setSelectedItem: (item: Item) => void;
  items: Item[];
};

export const SelectItemInput: React.FC<SelectItemInputProps> = ({
  selectedItem,
  setSelectedItem,
  items,
}) => {
  return (
    <Menu>
      <Tooltip label={items.length === 0 ? 'No items available' : ''}>
        <MenuButton
          as={Button}
          rightIcon={<ChevronDownIcon />}
          w="100%"
          h="2.675rem"
          isDisabled={items.length === 0}
        >
          {selectedItem ? (
            <ItemItem item={selectedItem} />
          ) : (
            <Text>Select Item</Text>
          )}
        </MenuButton>
      </Tooltip>
      <MenuList minW="20rem">
        {items.map((item: Item) => (
          <MenuItem key={item.id} onClick={() => setSelectedItem(item)}>
            <ItemItem item={item} />
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};

const ItemItem: React.FC<{ item: Item }> = ({ item }) => {
  const { name, itemId } = item;
  return (
    <HStack spacing={4} justify="space-between" w="100%">
      <Text fontSize="md" fontWeight="bold">
        {name}
      </Text>
      <Text color="gray.500" fontSize="sm">
        Item ID: {itemId}
      </Text>
    </HStack>
  );
};
