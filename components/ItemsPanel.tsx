import { SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { PropsWithChildren } from 'react';

import { useGame } from '@/contexts/GameContext';

import { SmallItemCard } from './ItemCard';

export const ItemsPanel: React.FC<PropsWithChildren> = () => {
  const { game } = useGame();

  return (
    <VStack pt={10} pb={20} spacing={10} w="100%">
      {(!game || game.items.length === 0) && (
        <VStack>
          <Text align="center">No items found.</Text>
        </VStack>
      )}
      {game && game.items.length > 0 && (
        <>
          <SimpleGrid columns={2} spacing={4} w="100%">
            {game.items.map(c => (
              <SmallItemCard key={c.id} {...c} chainId={game.chainId} />
            ))}
          </SimpleGrid>
        </>
      )}
    </VStack>
  );
};
