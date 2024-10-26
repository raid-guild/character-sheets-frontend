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

import { MultiSourceImage } from '@/components/MultiSourceImage';
import { Class } from '@/utils/types';

type SelectClassInputProps = {
  selectedClass: Class | null;
  setSelectedClass: (heldClass: Class) => void;
  classes: Class[];
};

export const SelectClassInput: React.FC<SelectClassInputProps> = ({
  selectedClass,
  setSelectedClass,
  classes,
}) => {
  return (
    <Menu>
      <Tooltip label={classes.length === 0 ? 'No classes available' : ''}>
        <MenuButton
          as={Button}
          rightIcon={<ChevronDownIcon />}
          w="100%"
          h="2.675rem"
          isDisabled={classes.length === 0}
        >
          {selectedClass ? (
            <ClassEntry heldClass={selectedClass} />
          ) : (
            <Text>Select Class</Text>
          )}
        </MenuButton>
      </Tooltip>
      <MenuList minW="20rem">
        {classes.map((heldClass: Class) => (
          <MenuItem
            key={heldClass.id}
            onClick={() => setSelectedClass(heldClass)}
          >
            <ClassEntry heldClass={heldClass} />
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};

const ClassEntry: React.FC<{ heldClass: Class }> = ({ heldClass }) => {
  const { name, image } = heldClass;
  return (
    <HStack spacing={4} justify="space-between" w="100%">
      <Text fontSize="md" fontWeight="bold">
        {name}
      </Text>

      <MultiSourceImage
        alt={`${name} image`}
        h="32px"
        w="32px"
        src={image}
        objectFit="contain"
      />
    </HStack>
  );
};
