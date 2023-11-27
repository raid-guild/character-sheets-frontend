import { GridItem, SimpleGrid, Text, VStack } from '@chakra-ui/react';

import { CharacterCardSmall } from '@/components/CharacterCard';
import { useGame } from '@/contexts/GameContext';

export const CharactersPanel: React.FC = () => {
  const { game } = useGame();

  const characters = game?.characters.filter(c => !c.removed) ?? [];

  if (!game || characters.length === 0) {
    return (
      <VStack as="main" py={20}>
        <Text align="center">No characters found.</Text>
      </VStack>
    );
  }

  return (
    <SimpleGrid
      spacing={{ base: 4, sm: 6, md: 8 }}
      w="100%"
      py={10}
      columns={{ base: 1, sm: 2, md: 3, xl: 4 }}
      alignItems="stretch"
    >
      {characters.map(c => (
        <GridItem key={c.id} w="100%">
          <CharacterCardSmall chainId={game.chainId} character={c} />
        </GridItem>
      ))}
    </SimpleGrid>
  );
};
