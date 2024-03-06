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
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import FuzzySearch from 'fuzzy-search';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useGame } from '@/contexts/GameContext';
import { Class } from '@/utils/types';

import { ClassCard, ClassCardSmall, ClassesTable } from '../ClassCard';
import { SquareIcon } from '../icons/SquareIcon';
import { VerticalListIcon } from '../icons/VerticalListIcon';

const CLASSES_MODAL_KEY = 'classes-modal';

type ClassesModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const ClassesModal: React.FC<ClassesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { game } = useGame();

  const [displayType, setDisplayType] = useState<
    'FULL_CARDS' | 'SMALL_CARDS' | 'TABLE_VIEW'
  >('SMALL_CARDS');

  const [searchedClasses, setSearchedClasses] = useState<Class[]>([]);
  const [searchText, setSearchText] = useState<string>('');

  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortAttribute, setSortAttribute] = useState<
    'classId' | 'name' | 'holders'
  >('classId');

  const classes: Class[] = useMemo(() => game?.classes || [], [game]);

  useEffect(() => {
    if (!game) return;
    const classesModalData = localStorage.getItem(
      `${CLASSES_MODAL_KEY}-${game.id}`,
    );
    if (classesModalData) {
      const {
        displayType: _displayType,
        sortOrder: _sortOrder,
        sortAttribute: _sortAttribute,
      } = JSON.parse(classesModalData);
      setDisplayType(_displayType);
      setSortOrder(_sortOrder);
      setSortAttribute(_sortAttribute);
    }
  }, [game]);

  useEffect(() => {
    const sortedClasses = classes.slice().sort((a, b) => {
      const numeric =
        sortAttribute === 'classId' || sortAttribute === 'holders';
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
      setSearchedClasses(sortedClasses);
      return;
    }

    const searcher = new FuzzySearch(sortedClasses, ['name', 'description'], {
      caseSensitive: false,
    });
    setSearchedClasses(searcher.search(searchText));
  }, [classes, searchText, sortAttribute, sortOrder]);

  const onSelectDisplayType = useCallback(
    (type: 'FULL_CARDS' | 'SMALL_CARDS' | 'TABLE_VIEW') => {
      setDisplayType(type);
      if (!game) return;
      localStorage.setItem(
        `${CLASSES_MODAL_KEY}-${game.id}`,
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
    if (sortAttribute === 'classId') return 'ID';
    if (sortAttribute === 'name') return 'Name';
    if (sortAttribute === 'holders') return 'Holders';
    return 'ID';
  }, [sortAttribute]);

  return (
    <Modal closeOnEsc closeOnOverlayClick isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent mt={{ base: 0, md: '84px' }}>
        <ModalHeader>
          <Flex flexDir={{ base: 'column', md: 'row' }} gap={4}>
            <Text textAlign="left" textTransform="initial" fontWeight="500">
              {game?.name}
            </Text>
            <HStack>
              <Image
                alt="classes"
                height="20px"
                src="/icons/users.svg"
                width="20px"
              />
              <Text
                letterSpacing="3px"
                fontSize="2xs"
                textTransform="uppercase"
              >
                Classes ({classes.length})
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
                placeholder="Search classes by name or description"
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
                        `${CLASSES_MODAL_KEY}-${game.id}`,
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
                    defaultValue="classId"
                    title="Attribute"
                    onChange={v => {
                      setSortAttribute(v as 'classId' | 'name' | 'holders');
                      if (!game) return;
                      localStorage.setItem(
                        `${CLASSES_MODAL_KEY}-${game.id}`,
                        JSON.stringify({
                          displayType,
                          sortOrder,
                          sortAttribute: v as 'classId' | 'name' | 'holders',
                        }),
                      );
                    }}
                    type="radio"
                    value={sortAttribute}
                  >
                    <MenuItemOption fontSize="sm" value="classId">
                      ID
                    </MenuItemOption>
                    <MenuItemOption fontSize="sm" value="name">
                      Name
                    </MenuItemOption>
                    <MenuItemOption fontSize="sm" value="holders">
                      # of Holders
                    </MenuItemOption>
                  </MenuOptionGroup>
                </MenuList>
              </Menu>
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
                searchedClasses.length > 0 &&
                searchedClasses.map(_class => (
                  <GridItem key={_class.id} w="100%">
                    {displayType === 'SMALL_CARDS' && (
                      <ClassCardSmall {..._class} />
                    )}
                    {displayType === 'FULL_CARDS' && <ClassCard {..._class} />}
                  </GridItem>
                ))}
            </SimpleGrid>
          )}
          {displayType === 'TABLE_VIEW' && searchedClasses.length > 0 && (
            <ClassesTable classes={searchedClasses} />
          )}
          {searchedClasses.length === 0 &&
            (classes.length === 0 ? (
              <Text size="sm">No classes found.</Text>
            ) : (
              <Text size="sm">
                No classes found. Try changing your filters or search text.
              </Text>
            ))}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
