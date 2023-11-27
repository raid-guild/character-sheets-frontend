import {
  GridItem,
  HStack,
  IconButton,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';

import { CharacterCard, CharacterCardSmall } from '@/components/CharacterCard';
import { useGame } from '@/contexts/GameContext';
import { SquareIcon } from './icons/SquareIcon';
import { VerticalListIcon } from './icons/VerticalListIcon';

import { useState } from 'react';

export const CharactersPanel: React.FC = () => {
  const { game } = useGame();

  const characters = game?.characters.filter(c => !c.removed) ?? [];

  const [displayType, setDisplayType] = useState<'CARDS' | 'VERTICAL'>('CARDS');

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
          color={displayType === 'CARDS' ? 'softblue' : 'white'}
          _hover={displayType === 'CARDS' ? {} : { color: 'whiteAlpha.500' }}
          onClick={() => setDisplayType('CARDS')}
        />
        <IconButton
          minW={4}
          aria-label="Vertical List"
          icon={<VerticalListIcon />}
          variant="unstyled"
          color={displayType === 'VERTICAL' ? 'softblue' : 'white'}
          _hover={displayType === 'VERTICAL' ? {} : { color: 'whiteAlpha.500' }}
          onClick={() => setDisplayType('VERTICAL')}
        />
      </HStack>
      <SimpleGrid
        spacing={{ base: 4, sm: 6, md: 8 }}
        w="100%"
        columns={displayType === 'CARDS' ? 1 : { base: 1, sm: 2, md: 3, xl: 4 }}
        alignItems="stretch"
      >
        {characters.map(c => (
          <GridItem key={c.id} w="100%">
            {displayType === 'VERTICAL' && (
              <CharacterCardSmall chainId={game.chainId} character={c} />
            )}
            {displayType === 'CARDS' && (
              <CharacterCard chainId={game.chainId} character={c} />
            )}
          </GridItem>
        ))}
      </SimpleGrid>
    </VStack>
  );
};
