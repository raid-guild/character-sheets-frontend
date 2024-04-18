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

import { shortenAddress } from '@/utils/helpers';
import { Character } from '@/utils/types';

type SelectCharacterInputProps = {
  selectedCharacter: Character | null;
  setSelectedCharacter: (character: Character) => void;
  characters: Character[];
};

export const SelectCharacterInput: React.FC<SelectCharacterInputProps> = ({
  selectedCharacter,
  setSelectedCharacter,
  characters,
}) => {
  return (
    <Menu>
      <Tooltip label={characters.length === 0 ? 'No characters available' : ''}>
        <MenuButton
          as={Button}
          rightIcon={<ChevronDownIcon />}
          w="100%"
          h="2.675rem"
          isDisabled={characters.length === 0}
        >
          {selectedCharacter ? (
            <CharacterItem character={selectedCharacter} />
          ) : (
            <Text>Select Character</Text>
          )}
        </MenuButton>
      </Tooltip>
      <MenuList minW="20rem">
        {characters.map((character: Character) => (
          <MenuItem
            key={character.account}
            onClick={() => setSelectedCharacter(character)}
          >
            <CharacterItem character={character} />
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};

const CharacterItem: React.FC<{ character: Character }> = ({ character }) => {
  const { name, account } = character;
  return (
    <HStack spacing={4} justify="space-between" w="100%">
      <Text fontSize="md" fontWeight="bold">
        {name}
      </Text>
      <Text color="gray.500" fontSize="sm">
        {shortenAddress(account)}
      </Text>
    </HStack>
  );
};
