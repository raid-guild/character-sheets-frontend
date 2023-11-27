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
    'FULL_CARDS' | 'VERITICAL_LIST'
  >('VERITICAL_LIST');

  if (!game || characters.length === 0) {
    return (
      <VStack as="main" py={20}>
        <Text align="center">No characters found.</Text>
      </VStack>
    );
  }

  return (
    <VStack w="100%" pb={10} spacing={4}>
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
          color={displayType === 'VERITICAL_LIST' ? 'softblue' : 'white'}
          _hover={
            displayType === 'VERITICAL_LIST' ? {} : { color: 'whiteAlpha.500' }
          }
          onClick={() => setDisplayType('VERITICAL_LIST')}
        />
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
            {displayType === 'VERITICAL_LIST' && (
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
