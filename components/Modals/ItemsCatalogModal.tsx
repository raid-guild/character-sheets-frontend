import {
  Flex,
  GridItem,
  HStack,
  IconButton,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Text,
} from '@chakra-ui/react';
import { useState } from 'react';

import { useGame } from '@/contexts/GameContext';
import { Character } from '@/utils/types';

import { SquareIcon } from '../icons/SquareIcon';
import { VerticalListIcon } from '../icons/VerticalListIcon';
import { ItemCard, ItemCardSmall } from '../ItemCard';

type ItemsCatalogModalProps = {
  isOpen: boolean;
  onClose: () => void;
  character?: Character;
};

export const ItemsCatalogModal: React.FC<ItemsCatalogModalProps> = ({
  character,
  isOpen,
  onClose,
}) => {
  const { game } = useGame();

  const [displayType, setDisplayType] = useState<
    'FULL_CARDS' | 'VERTICAL_LIST'
  >('VERTICAL_LIST');

  const items = character?.heldItems || game?.items || [];

  return (
    <Modal closeOnEsc closeOnOverlayClick isOpen={isOpen} onClose={onClose}>
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
              aria-label="Vertical List"
              color={displayType === 'VERTICAL_LIST' ? 'softblue' : 'white'}
              icon={<VerticalListIcon />}
              minW={4}
              onClick={() => setDisplayType('VERTICAL_LIST')}
              variant="unstyled"
              _hover={
                displayType === 'VERTICAL_LIST'
                  ? {}
                  : { color: 'whiteAlpha.500' }
              }
            />
          </HStack>
          <SimpleGrid
            alignItems="stretch"
            columns={
              displayType === 'FULL_CARDS' ? 1 : { base: 1, sm: 2, md: 3 }
            }
            spacing={{ base: 4, sm: 6, md: 8 }}
            w="100%"
          >
            {game &&
              items.length > 0 &&
              items.map(item => (
                <GridItem key={item.id} w="100%">
                  {displayType === 'VERTICAL_LIST' && (
                    <ItemCardSmall
                      holderId={character?.characterId}
                      {...item}
                    />
                  )}
                  {displayType === 'FULL_CARDS' && (
                    <ItemCard holderId={character?.characterId} {...item} />
                  )}
                </GridItem>
              ))}
            {items.length === 0 && <Text align="center">No items found.</Text>}
          </SimpleGrid>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
