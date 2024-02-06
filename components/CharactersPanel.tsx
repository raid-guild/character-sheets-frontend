import {
  GridItem,
  HStack,
  IconButton,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useState } from 'react';

import { CharacterCard, CharacterCardSmall } from '@/components/CharacterCard';
import { useGame } from '@/contexts/GameContext';

import { SquareIcon } from './icons/SquareIcon';
import { VerticalListIcon } from './icons/VerticalListIcon';

export const CharactersPanel: React.FC = () => {
  const { game } = useGame();

  const characters = game?.characters.filter(c => !c.removed) ?? [];

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
      <SimpleGrid
        spacing={{ base: 4, sm: 6, md: 8 }}
        w="100%"
        columns={
          displayType === 'FULL_CARDS' ? 1 : { base: 1, sm: 2, md: 3, xl: 4 }
        }
        alignItems="stretch"
      >
        {characters.map(c => (
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
