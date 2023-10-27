import { SimpleGrid, Text, VStack } from '@chakra-ui/react';

import { SmallCharacterCard } from '@/components/CharacterCard';
import { useGame } from '@/contexts/GameContext';
import { DEFAULT_CHAIN } from '@/lib/web3';

export const CharactersPanel: React.FC = () => {
  const { game } = useGame();

  const characters = game?.characters.filter(c => !c.removed) ?? [];

  if (characters.length > 0) {
    return (
      <SimpleGrid columns={1} spacing={8} w="100%">
        {characters.map(c => (
          <SmallCharacterCard
            key={c.id}
            chainId={DEFAULT_CHAIN.id}
            character={c}
          />
        ))}
      </SimpleGrid>
    );
  }
  return (
    <VStack as="main" pt={20}>
      <Text align="center">No characters found.</Text>
    </VStack>
  );
};
