import { SimpleGrid, Text, VStack } from '@chakra-ui/react';

import { useGame } from '@/contexts/GameContext';

import { ClassCard } from './ClassCard';

export const ClassesPanel: React.FC = () => {
  const { game, isMaster } = useGame();

  if (!game || game.classes.length === 0) {
    return (
      <VStack as="main" py={20}>
        <Text align="center">No classes found.</Text>
      </VStack>
    );
  }

  return (
    <VStack as="main" py={10} w="100%">
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="100%">
        {game.classes.map(c => (
          <ClassCard
            key={c.id}
            chainId={game.chainId}
            isMaster={isMaster}
            {...c}
          />
        ))}
      </SimpleGrid>
    </VStack>
  );
};
