import { SimpleGrid, Text, VStack } from '@chakra-ui/react';

import { useGame } from '@/contexts/GameContext';

import { SmallClassCard } from './ClassCard';

export const ClassesPanel: React.FC = () => {
  const { game, isMaster } = useGame();

  function content() {
    if (!game || game.classes.length === 0) {
      return (
        <VStack as="main">
          <Text align="center">No classes found.</Text>
        </VStack>
      );
    }

    return (
      <SimpleGrid columns={2} spacing={4} w="100%">
        {game.classes.map(c => (
          <SmallClassCard
            key={c.id}
            {...c}
            chainId={game.chainId}
            isMaster={isMaster}
          />
        ))}
      </SimpleGrid>
    );
  }
  return (
    <VStack as="main" pt={10} pb={20} spacing={10} w="100%">
      <>{content()}</>
    </VStack>
  );
};
