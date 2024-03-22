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
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  CharacterCard,
  CharacterCardSmall,
  CharactersTable,
} from '@/components/CharacterCard';
import { useGame } from '@/contexts/GameContext';
import { Character } from '@/utils/types';

import { SquareIcon } from './icons/SquareIcon';
import { VerticalListIcon } from './icons/VerticalListIcon';

const CHARACTERS_PANEL_KEY = 'characters-panel';

export const CharactersPanel: React.FC = () => {
  const { game } = useGame();

  const [displayType, setDisplayType] = useState<
    'FULL_CARDS' | 'SMALL_CARDS' | 'VERTICAL_LIST'
  >('SMALL_CARDS');

  const [searchedCharacters, setSearchedCharacters] = useState<Character[]>([]);
  const [searchText, setSearchText] = useState<string>('');

  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortAttribute, setSortAttribute] = useState<
    'characterId' | 'name' | 'experience'
  >('characterId');

  const [operatorFilter, setOperatorFilter] = useState<
    'more' | 'less' | 'equal'
  >('more');
  const [amountFilter, setAmountFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<
    'experience' | 'heldItem' | 'class'
  >('experience');
  const [idFilter, setIdFilter] = useState<string>('');

  const characters = useMemo(
    () => game?.characters.filter(c => !c.removed) ?? [],
    [game],
  );

  const idOptions = useMemo(() => {
    if (categoryFilter === 'heldItem') {
      return game?.items.map(i => i) ?? [];
    }
    if (categoryFilter === 'class') {
      return game?.classes.map(c => c) ?? [];
    }
    return [];
  }, [categoryFilter, game]);

  useEffect(() => {
    if (!game) return;
    const charactersPanelData = localStorage.getItem(
      `${CHARACTERS_PANEL_KEY}-${game.id}`,
    );
    if (charactersPanelData) {
      const {
        displayType: _displayType,
        sortOrder: _sortOrder,
        sortAttribute: _sortAttribute,
      } = JSON.parse(charactersPanelData);
      setDisplayType(_displayType);
      setSortOrder(_sortOrder);
      setSortAttribute(_sortAttribute);
    }
  }, [game]);

  useEffect(() => {
    const filteredCharacters = characters.filter(c => {
      if (amountFilter === '') return true;
      if (Number(amountFilter) < 0) return false;

      if (categoryFilter === 'experience') {
        if (operatorFilter === 'more') {
          return Number(c.experience) > Number(amountFilter);
        }
        if (operatorFilter === 'less') {
          return Number(c.experience) < Number(amountFilter);
        }
        return Number(c.experience) === Number(amountFilter);
      }
      if (categoryFilter === 'heldItem') {
        const itemById = c.heldItems.find(i => i.id === idFilter);
        if (itemById) {
          if (operatorFilter === 'more') {
            return Number(itemById.amount) > Number(amountFilter);
          }
          if (operatorFilter === 'less') {
            return Number(itemById.amount) < Number(amountFilter);
          }
          return Number(itemById.amount) === Number(amountFilter);
        }
      }
      if (categoryFilter === 'class') {
        const classById = c.heldClasses.find(cl => cl.id === idFilter);
        if (classById) {
          if (operatorFilter === 'more') {
            return Number(classById.level) > Number(amountFilter);
          }
          if (operatorFilter === 'less') {
            return Number(classById.level) < Number(amountFilter);
          }
          return Number(classById.level) === Number(amountFilter);
        }
      }
      return false;
    });

    const sortedCharacters = filteredCharacters.slice().sort((a, b) => {
      const numeric =
        sortAttribute === 'characterId' || sortAttribute === 'experience';
      if (sortOrder === 'asc') {
        if (numeric) {
          return Number(a[sortAttribute]) - Number(b[sortAttribute]);
        }
        return a[sortAttribute].localeCompare(b[sortAttribute]);
      } else {
        if (numeric) {
          return Number(b[sortAttribute]) - Number(a[sortAttribute]);
        }
        return b[sortAttribute].localeCompare(a[sortAttribute]);
      }
    });
    if (searchText === '') {
      setSearchedCharacters(sortedCharacters);
      return;
    }

    const searcher = new FuzzySearch(
      sortedCharacters,
      ['name', 'description', 'classes.name', 'heldItems.name'],
      {
        caseSensitive: false,
      },
    );
    setSearchedCharacters(searcher.search(searchText));
  }, [
    amountFilter,
    categoryFilter,
    characters,
    idFilter,
    operatorFilter,
    searchText,
    sortAttribute,
    sortOrder,
  ]);

  const onSelectDisplayType = useCallback(
    (type: 'FULL_CARDS' | 'SMALL_CARDS' | 'VERTICAL_LIST') => {
      setDisplayType(type);
      if (!game) return;
      localStorage.setItem(
        `${CHARACTERS_PANEL_KEY}-${game.id}`,
        JSON.stringify({
          displayType: type,
          sortOrder,
          sortAttribute,
        }),
      );
    },
    [game, sortOrder, sortAttribute],
  );

  const sortedLabel = useMemo(() => {
    if (sortAttribute === 'characterId') return 'ID';
    if (sortAttribute === 'name') return 'Name';
    return 'XP';
  }, [sortAttribute]);

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
    <VStack pb={10} spacing={6} w="100%">
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
            onClick={() => onSelectDisplayType('FULL_CARDS')}
          />
          <IconButton
            aria-label="Small Cards"
            color={displayType === 'SMALL_CARDS' ? 'softblue' : 'white'}
            icon={<VerticalListIcon />}
            minW={4}
            onClick={() => onSelectDisplayType('SMALL_CARDS')}
            variant="unstyled"
            _hover={
              displayType === 'SMALL_CARDS' ? {} : { color: 'whiteAlpha.500' }
            }
          />
          <IconButton
            aria-label="Vertical List"
            color={displayType === 'VERTICAL_LIST' ? 'softblue' : 'white'}
            icon={<VerticalListIcon />}
            onClick={() => onSelectDisplayType('VERTICAL_LIST')}
            minW={4}
            transform="rotate(90deg) translateX(1.5px)"
            variant="unstyled"
            _active={{ transform: 'rotate(90deg)  translateX(1.5px)' }}
            _hover={
              displayType === 'VERTICAL_LIST' ? {} : { color: 'whiteAlpha.500' }
            }
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
            <MenuButton as={Button} size="sm">
              {`Sorted by ${sortedLabel} ${sortOrder === 'asc' ? '▲' : '▼'}`}
            </MenuButton>
            <MenuList minWidth="240px">
              <MenuOptionGroup
                defaultValue="asc"
                onChange={v => {
                  setSortOrder(v as 'asc' | 'desc');
                  localStorage.setItem(
                    `${CHARACTERS_PANEL_KEY}-${game.id}`,
                    JSON.stringify({
                      displayType,
                      sortOrder: v as 'asc' | 'desc',
                      sortAttribute,
                    }),
                  );
                }}
                title="Order"
                type="radio"
                value={sortOrder}
              >
                <MenuItemOption fontSize="sm" value="asc">
                  Low to High
                </MenuItemOption>
                <MenuItemOption fontSize="sm" value="desc">
                  High to Low
                </MenuItemOption>
              </MenuOptionGroup>
              <MenuDivider />
              <MenuOptionGroup
                defaultValue="characterId"
                title="Attribute"
                onChange={v => {
                  setSortAttribute(v as 'characterId' | 'name' | 'experience');
                  localStorage.setItem(
                    `${CHARACTERS_PANEL_KEY}-${game.id}`,
                    JSON.stringify({
                      displayType,
                      sortOrder,
                      sortAttribute: v as 'characterId' | 'name' | 'experience',
                    }),
                  );
                }}
                type="radio"
                value={sortAttribute}
              >
                <MenuItemOption fontSize="sm" value="characterId">
                  ID
                </MenuItemOption>
                <MenuItemOption fontSize="sm" value="name">
                  Name
                </MenuItemOption>
                <MenuItemOption fontSize="sm" value="experience">
                  XP
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
          <Select
            onChange={({ target }) =>
              setOperatorFilter(target.value as 'more' | 'less' | 'equal')
            }
            // placeholder="OPERATOR"
            size="sm"
            value={operatorFilter}
            variant="outline"
          >
            <option value="more">more than</option>
            <option value="less">less than</option>
            <option value="equal">equal to</option>
          </Select>
          <Input
            h="30px"
            fontSize="xs"
            minW="40px"
            maxW="100px"
            onChange={e => setAmountFilter(e.target.value)}
            placeholder="amount"
            type="number"
            value={amountFilter}
          />
          <Select
            onChange={({ target }) =>
              setCategoryFilter(
                target.value as 'experience' | 'heldItem' | 'class',
              )
            }
            // placeholder="CATEGORY"
            size="sm"
            value={categoryFilter}
            variant="outline"
          >
            <option value="experience">XP</option>
            <option value="heldItem">items</option>
            <option value="class">levels in class</option>
          </Select>
          {idOptions.length > 0 && (
            <>
              <Text>of</Text>
              <Select
                onChange={({ target }) => setIdFilter(target.value)}
                // placeholder="ID"
                size="sm"
                value={idFilter}
                variant="outline"
              >
                {idOptions.map(o => (
                  <option key={`item-or-class-id-${o.id}`} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </Select>
            </>
          )}
        </HStack>
      </VStack>
      {searchedCharacters.length === 0 &&
        (characters.length === 0 ? (
          <Text size="sm">No characters found.</Text>
        ) : (
          <Text size="sm">
            No characters found. Try changing your filters or search text.
          </Text>
        ))}
      {(displayType === 'FULL_CARDS' || displayType === 'SMALL_CARDS') &&
        searchedCharacters.length > 0 && (
          <SimpleGrid
            alignItems="stretch"
            columns={
              displayType === 'FULL_CARDS'
                ? 1
                : { base: 1, sm: 2, md: 3, xl: 4 }
            }
            spacing={{ base: 4, sm: 6, md: 8 }}
            w="100%"
          >
            {searchedCharacters.map(c => (
              <GridItem key={c.id} w="100%">
                {displayType === 'SMALL_CARDS' && (
                  <CharacterCardSmall chainId={game.chainId} character={c} />
                )}
                {displayType === 'FULL_CARDS' && (
                  <CharacterCard chainId={game.chainId} character={c} />
                )}
              </GridItem>
            ))}
          </SimpleGrid>
        )}
      {displayType === 'VERTICAL_LIST' && searchedCharacters.length > 0 && (
        <CharactersTable
          chainId={game.chainId}
          characters={searchedCharacters}
        />
      )}
    </VStack>
  );
};
