import { Text, VStack } from '@chakra-ui/react';

import { GameCard } from '@/components/GameCard';
import { useGamesContext } from '@/contexts/GamesContext';

export default function AllGames(): JSX.Element {
  const { allGames, loading } = useGamesContext();

  if (loading) {
    return (
      <VStack>
        <Text>Loading...</Text>
      </VStack>
    );
  }

  if (!allGames || allGames.length === 0) {
    return (
      <VStack>
        <Text>No games found.</Text>
      </VStack>
    );
  }

  return (
    <VStack spacing={10}>
      {allGames.map(game => (
        <GameCard key={game.id} {...game} />
      ))}
    </VStack>
  );
}
