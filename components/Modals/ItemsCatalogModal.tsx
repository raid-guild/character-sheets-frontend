import {
  Button,
  Flex,
  GridItem,
  HStack,
  IconButton,
  Image,
  Input,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import FuzzySearch from 'fuzzy-search';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useGame } from '@/contexts/GameContext';
import { useItemActions } from '@/contexts/ItemActionsContext';
import { Character, Item } from '@/utils/types';

import { SquareIcon } from '../icons/SquareIcon';
import { VerticalListIcon } from '../icons/VerticalListIcon';
import { ItemCard, ItemCardSmall, ItemsTable } from '../ItemCard';

type ItemsCatalogModalProps = {
  isOpen: boolean;
  onClose: () => void;
  character?: Character;
};

const ITEMS_MODAL_KEY = 'items-modal';

export const ItemsCatalogModal: React.FC<ItemsCatalogModalProps> = ({
  character,
  isOpen,
  onClose,
}) => {
  const { game } = useGame();
  const { areAnyItemModalsOpen } = useItemActions();

  const [displayType, setDisplayType] = useState<
    'FULL_CARDS' | 'SMALL_CARDS' | 'TABLE_VIEW'
  >('SMALL_CARDS');

  const [searchedItems, setSearchedItems] = useState<Item[]>([]);
  const [searchText, setSearchText] = useState<string>('');

  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortAttribute, setSortAttribute] = useState<
    'itemId' | 'name' | 'holders' | 'supply'
  >('itemId');

  const [operatorFilter, setOperatorFilter] = useState<
    'more' | 'less' | 'equal'
  >('more');
  const [amountFilter, setAmountFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<
    'experience' | 'item' | 'class'
  >('experience');
  const [idFilter, setIdFilter] = useState<string>('');

  const items = useMemo(
    () => character?.heldItems || game?.items || [],
    [character, game],
  );

  const idOptions = useMemo(() => {
    if (categoryFilter === 'item') {
      return game?.items.map(i => i) ?? [];
    }
    if (categoryFilter === 'class') {
      return game?.classes.map(c => c) ?? [];
    }
    return [];
  }, [categoryFilter, game]);

  useEffect(() => {
    if (!game) return;
    const itemsModalData = localStorage.getItem(
      `${ITEMS_MODAL_KEY}-${game.id}`,
    );
    if (itemsModalData) {
      const {
        displayType: _displayType,
        sortOrder: _sortOrder,
        sortAttribute: _sortAttribute,
      } = JSON.parse(itemsModalData);
      setDisplayType(_displayType);
      setSortOrder(_sortOrder);
      setSortAttribute(_sortAttribute);
    }
  }, [game]);

  useEffect(() => {
    const filteredItems = items.filter(() => {
      if (amountFilter === '') return true;
      if (Number(amountFilter) < 0) return false;

      {
        /* TODO: Fix Filters!!
      if (categoryFilter === 'experience') {
        const requiredXp =
          item.requirements.find(
            r => r.assetAddress === game?.experienceAddress,
          )?.amount ?? '0';
        if (operatorFilter === 'more') {
          return Number(requiredXp) > Number(amountFilter);
        }
        if (operatorFilter === 'less') {
          return Number(requiredXp) < Number(amountFilter);
        }
        return Number(requiredXp) === Number(amountFilter);
      }
      const formattedIdFilter = idFilter
        ? Number(idFilter.split('-')[2]).toString()
        : '';

      if (categoryFilter === 'item') {
        const requiredItems = item.requirements.filter(
          r => r.assetAddress === game?.itemsAddress,
        );
        const itemById = requiredItems.find(
          ri => ri.assetId === formattedIdFilter,
        );
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
        const requiredClasses = item.requirements.filter(
          r => r.assetAddress === game?.classesAddress,
        );
        const classById = requiredClasses.find(
          rc => rc.assetId === formattedIdFilter,
        );
        if (classById) {
          if (operatorFilter === 'more') {
            return Number(classById.amount) > Number(amountFilter);
          }
          if (operatorFilter === 'less') {
            return Number(classById.amount) < Number(amountFilter);
          }
          return Number(classById.amount) === Number(amountFilter);
        }
      }
      return false;
        */
      }
      return true;
    });

    const sortedItems = filteredItems.slice().sort((a, b) => {
      const numeric =
        sortAttribute === 'itemId' ||
        sortAttribute === 'holders' ||
        sortAttribute === 'supply';
      if (sortOrder === 'asc') {
        if (numeric) {
          if (sortAttribute === 'holders') {
            return (
              Number(a[sortAttribute].length) - Number(b[sortAttribute].length)
            );
          }
          return Number(a[sortAttribute]) - Number(b[sortAttribute]);
        }
        return a[sortAttribute].localeCompare(b[sortAttribute]);
      } else {
        if (numeric) {
          if (sortAttribute === 'holders') {
            return (
              Number(b[sortAttribute].length) - Number(a[sortAttribute].length)
            );
          }
          return Number(b[sortAttribute]) - Number(a[sortAttribute]);
        }
        return b[sortAttribute].localeCompare(a[sortAttribute]);
      }
    });

    if (searchText === '') {
      setSearchedItems(sortedItems);
      return;
    }

    const searcher = new FuzzySearch(sortedItems, ['name', 'description'], {
      caseSensitive: false,
    });
    setSearchedItems(searcher.search(searchText));
  }, [
    amountFilter,
    categoryFilter,
    game,
    idFilter,
    items,
    operatorFilter,
    searchText,
    sortAttribute,
    sortOrder,
  ]);

  const onSelectDisplayType = useCallback(
    (type: 'FULL_CARDS' | 'SMALL_CARDS' | 'TABLE_VIEW') => {
      setDisplayType(type);
      if (!game) return;
      localStorage.setItem(
        `${ITEMS_MODAL_KEY}-${game.id}`,
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
    if (sortAttribute === 'itemId') return 'ID';
    if (sortAttribute === 'name') return 'Name';
    if (sortAttribute === 'holders') return 'Holders';
    if (sortAttribute === 'supply') return 'Supply';
    return 'ID';
  }, [sortAttribute]);

  return (
    <Modal
      closeOnEsc
      closeOnOverlayClick
      isOpen={isOpen && !areAnyItemModalsOpen}
      onClose={onClose}
    >
      <ModalOverlay />
      <ModalContent mt={{ base: 0, md: '84px' }}>
        <ModalHeader>
          <Flex flexDir={{ base: 'column', md: 'row' }} gap={4}>
            <Text textAlign="left" textTransform="initial" fontWeight="500">
              {character ? character.name : game?.name}
            </Text>
            <HStack>
              <Image
                alt="items"
                height="20px"
                src="/icons/items.svg"
                width="20px"
              />
              <Text
                letterSpacing="3px"
                fontSize="2xs"
                textTransform="uppercase"
              >
                Items Catalog ({items.length})
              </Text>
            </HStack>
          </Flex>
          <ModalCloseButton size="lg" />
        </ModalHeader>
        <ModalBody>
          <HStack justifyContent="flex-end" mb={6} w="100%">
            <IconButton
              aria-label="Full Cards"
              color={displayType === 'FULL_CARDS' ? 'softblue' : 'white'}
              icon={<SquareIcon />}
              minW={4}
              onClick={() => setDisplayType('FULL_CARDS')}
              variant="unstyled"
              _hover={
                displayType === 'FULL_CARDS' ? {} : { color: 'whiteAlpha.500' }
              }
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
              color={displayType === 'TABLE_VIEW' ? 'softblue' : 'white'}
              icon={<VerticalListIcon />}
              onClick={() => onSelectDisplayType('TABLE_VIEW')}
              minW={4}
              transform="rotate(90deg) translateX(1.5px)"
              variant="unstyled"
              _active={{ transform: 'rotate(90deg)  translateX(1.5px)' }}
              _hover={
                displayType === 'TABLE_VIEW' ? {} : { color: 'whiteAlpha.500' }
              }
            />
          </HStack>
          <VStack alignItems="flex-start" mb={8} spacing={4} w="100%">
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
                placeholder="Search items by name or description"
                type="text"
                value={searchText}
              />
              <Menu closeOnSelect={false}>
                <MenuButton as={Button} size="sm">
                  {`Sorted by ${sortedLabel} ${
                    sortOrder === 'asc' ? '▲' : '▼'
                  }`}
                </MenuButton>
                <MenuList minWidth="240px">
                  <MenuOptionGroup
                    defaultValue="asc"
                    onChange={v => {
                      setSortOrder(v as 'asc' | 'desc');
                      if (!game) return;
                      localStorage.setItem(
                        `${ITEMS_MODAL_KEY}-${game.id}`,
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
                    defaultValue="itemId"
                    title="Attribute"
                    onChange={v => {
                      setSortAttribute(
                        v as 'itemId' | 'name' | 'holders' | 'supply',
                      );
                      if (!game) return;
                      localStorage.setItem(
                        `${ITEMS_MODAL_KEY}-${game.id}`,
                        JSON.stringify({
                          displayType,
                          sortOrder,
                          sortAttribute: v as
                            | 'itemId'
                            | 'name'
                            | 'holders'
                            | 'supply',
                        }),
                      );
                    }}
                    type="radio"
                    value={sortAttribute}
                  >
                    <MenuItemOption fontSize="sm" value="itemId">
                      ID
                    </MenuItemOption>
                    <MenuItemOption fontSize="sm" value="name">
                      Name
                    </MenuItemOption>
                    <MenuItemOption fontSize="sm" value="holders">
                      # of Holders
                    </MenuItemOption>
                    <MenuItemOption fontSize="sm" value="supply">
                      Supply
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
              <Text>Requires</Text>
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
                fontSize="xs"
                h="30px"
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
                    target.value as 'experience' | 'item' | 'class',
                  )
                }
                // placeholder="CATEGORY"
                size="sm"
                value={categoryFilter}
                variant="outline"
              >
                <option value="experience">XP</option>
                <option value="item">items</option>
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
          {(displayType === 'FULL_CARDS' || displayType === 'SMALL_CARDS') && (
            <SimpleGrid
              alignItems="stretch"
              columns={
                displayType === 'FULL_CARDS' ? 1 : { base: 1, sm: 2, md: 3 }
              }
              spacing={{ base: 4, sm: 6, md: 8 }}
              w="100%"
            >
              {game &&
                searchedItems.length > 0 &&
                searchedItems.map(item => (
                  <GridItem key={item.id} w="100%">
                    {displayType === 'SMALL_CARDS' && (
                      <ItemCardSmall
                        holderId={character?.characterId}
                        holderCharacter={character}
                        {...item}
                      />
                    )}
                    {displayType === 'FULL_CARDS' && (
                      <ItemCard
                        holderId={character?.characterId}
                        holderCharacter={character}
                        {...item}
                      />
                    )}
                  </GridItem>
                ))}
            </SimpleGrid>
          )}
          {displayType === 'TABLE_VIEW' && searchedItems.length > 0 && (
            <ItemsTable items={searchedItems} />
          )}
          {searchedItems.length === 0 &&
            (items.length === 0 ? (
              <Text size="sm">No items found.</Text>
            ) : (
              <Text size="sm">
                No items found. Try changing your filters or search text.
              </Text>
            ))}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
