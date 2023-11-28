import { SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { PropsWithChildren } from 'react';

import { useGame } from '@/contexts/GameContext';

import { ItemCard } from './ItemCard';

export const ItemsPanel: React.FC<PropsWithChildren> = () => {
  const { game, character } = useGame();

  if (!game || game.items.length === 0) {
    return (
      <VStack as="main" py={20}>
        <Text align="center">No items found.</Text>
      </VStack>
    );
  }

  return (
    <VStack as="main" py={10} w="100%">
      <SimpleGrid columns={2} spacing={4} w="100%">
        {game.items.map(c => (
          <ItemCard
            key={c.id}
            {...c}
            chainId={game.chainId}
            holderId={character?.characterId}
          />
        ))}
      </SimpleGrid>
    </VStack>
  );
};
