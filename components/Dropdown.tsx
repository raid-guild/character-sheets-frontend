import { ChevronDownIcon } from '@chakra-ui/icons';
import {
  Button,
  HStack,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
} from '@chakra-ui/react';

type DropdownProps = {
  options: string[];
  selectedOption: string;
  setSelectedOption: (option: string) => void;
};

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  selectedOption,
  setSelectedOption,
}) => {
  return (
    <Menu>
      <MenuButton
        as={Button}
        h="2.675rem"
        rightIcon={<ChevronDownIcon />}
        w="100%"
      >
        {selectedOption ? (
          <SelectedOption option={selectedOption} />
        ) : (
          <Text>Select Option</Text>
        )}
      </MenuButton>
      <MenuList minW={{ base: 'auto', sm: '20rem' }}>
        {options.map((option: string) => (
          <MenuItem key={option} onClick={() => setSelectedOption(option)}>
            <SelectedOption option={option} />
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};

const SelectedOption: React.FC<{ option: string }> = ({ option }) => {
  return (
    <HStack justify="space-between" spacing={4} w="100%">
      <Text fontSize={{ base: 'xs', sm: 'md' }} fontWeight="bold">
        {option}
      </Text>
    </HStack>
  );
};
