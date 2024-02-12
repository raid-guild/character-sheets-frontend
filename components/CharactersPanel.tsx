import {
  Button,
  GridItem,
  HStack,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  Select,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import FuzzySearch from 'fuzzy-search';
import { useEffect, useMemo, useState } from 'react';

import { CharacterCard, CharacterCardSmall } from '@/components/CharacterCard';
import { useGame } from '@/contexts/GameContext';
import { Character } from '@/utils/types';

import { SquareIcon } from './icons/SquareIcon';
import { VerticalListIcon } from './icons/VerticalListIcon';

export const CharactersPanel: React.FC = () => {
  const { game } = useGame();

  const [searchedCharacters, setSearchedCharacters] = useState<Character[]>([]);
  const [searchText, setSearchText] = useState('');

  const characters = useMemo(
    () => game?.characters.filter(c => !c.removed) ?? [],
    [game],
  );

  useEffect(() => {
    if (searchText === '') {
      setSearchedCharacters(characters);
      return;
    }

    const searcher = new FuzzySearch(
      characters,
      ['name', 'description', 'classes.name', 'heldItems.name'],
      {
        caseSensitive: false,
      },
    );
    setSearchedCharacters(searcher.search(searchText));
  }, [characters, searchText]);

  const [displayType, setDisplayType] = useState<
    'FULL_CARDS' | 'VERTICAL_LIST'
  >('VERTICAL_LIST');

  if (!game || characters.length === 0) {
    return (
      <VStack as="main" py={20} w="100%" align="stretch" spacing={8}>
        <Text letterSpacing="3px" fontSize="2xs" textTransform="uppercase">
          All Characters
        </Text>
        <Text>There are no characters in this game.</Text>
      </VStack>
    );
  }

  return (
    <VStack w="100%" pb={10} spacing={6}>
      <HStack w="100%" justifyContent="space-between">
        <Text
          letterSpacing="3px"
          fontSize="2xs"
          textTransform="uppercase"
          flexShrink={0}
        >
          All Characters
        </Text>
        <HStack w="100%" justifyContent="flex-end">
          <IconButton
            minW={4}
            aria-label="Full Cards"
            icon={<SquareIcon />}
            variant="unstyled"
            color={displayType === 'FULL_CARDS' ? 'softblue' : 'white'}
            _hover={
              displayType === 'FULL_CARDS' ? {} : { color: 'whiteAlpha.500' }
            }
            onClick={() => setDisplayType('FULL_CARDS')}
          />
          <IconButton
            minW={4}
            aria-label="Vertical List"
            icon={<VerticalListIcon />}
            variant="unstyled"
            color={displayType === 'VERTICAL_LIST' ? 'softblue' : 'white'}
            _hover={
              displayType === 'VERTICAL_LIST' ? {} : { color: 'whiteAlpha.500' }
            }
            onClick={() => setDisplayType('VERTICAL_LIST')}
          />
        </HStack>
      </HStack>
      <VStack alignItems="flex-start" spacing={4} w="100%">
        <HStack
          flexDirection={{ base: 'column-reverse', md: 'row' }}
          spacing={4}
          w="100%"
        >
          <Input
            fontSize="xs"
            h="40px"
            maxW={{ base: '100%', md: '400px' }}
            onChange={e => setSearchText(e.target.value)}
            placeholder="Search characters by name, description, etc."
            type="text"
            value={searchText}
          />
          <Menu closeOnSelect={false}>
            <MenuButton as={Button} size="xs">
              Sort
            </MenuButton>
            <MenuList minWidth="240px">
              <MenuOptionGroup defaultValue="asc" title="Order" type="radio">
                <MenuItemOption fontSize="sm" value="asc">
                  Ascending
                </MenuItemOption>
                <MenuItemOption fontSize="sm" value="desc">
                  Descending
                </MenuItemOption>
              </MenuOptionGroup>
              <MenuDivider />
              <MenuOptionGroup
                defaultValue="id"
                title="Attribute"
                type="checkbox"
              >
                <MenuItemOption fontSize="sm" value="id">
                  ID
                </MenuItemOption>
                <MenuItemOption fontSize="sm" value="name">
                  Name
                </MenuItemOption>
                <MenuItemOption fontSize="sm" value="description">
                  Description
                </MenuItemOption>
                <MenuItemOption fontSize="sm" value="classes">
                  Classes
                </MenuItemOption>
              </MenuOptionGroup>
            </MenuList>
          </Menu>
        </HStack>
        <HStack
          flexDirection={{ base: 'column', md: 'row' }}
          spacing={2}
          w="100%"
        >
          <Text>Has</Text>
          <Select placeholder="OPERATOR" size="xs" variant="outline">
            <option value="option1">more than</option>
            <option value="option2">less than</option>
            <option value="option3">equal to</option>
          </Select>
          <Input
            h="30px"
            fontSize="xs"
            minW="40px"
            placeholder="amount"
            type="number"
          />
          <Select placeholder="CATEGORY" size="xs" variant="outline">
            <option value="option1">xp</option>
            <option value="option2">item</option>
            <option value="option3">class</option>
          </Select>
          <Select placeholder="ID" size="xs" variant="outline">
            <option value="option1">1</option>
            <option value="option2">2</option>
            <option value="option3">3</option>
          </Select>
        </HStack>
      </VStack>
      <SimpleGrid
        spacing={{ base: 4, sm: 6, md: 8 }}
        w="100%"
        columns={
          displayType === 'FULL_CARDS' ? 1 : { base: 1, sm: 2, md: 3, xl: 4 }
        }
        alignItems="stretch"
      >
        {searchedCharacters.map(c => (
          <GridItem key={c.id} w="100%">
            {displayType === 'VERTICAL_LIST' && (
              <CharacterCardSmall chainId={game.chainId} character={c} />
            )}
            {displayType === 'FULL_CARDS' && (
              <CharacterCard chainId={game.chainId} character={c} />
            )}
          </GridItem>
        ))}
      </SimpleGrid>
    </VStack>
  );
};
