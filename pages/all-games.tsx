import { Text, VStack } from '@chakra-ui/react';

import { useGames } from '@/hooks/useGames';

export default function AllGames(): JSX.Element {
  const { games, loading } = useGames();

  if (loading) {
    return (
      <VStack as="main" pt={20}>
        <Text>Loading...</Text>
      </VStack>
    );
  }

  if (!games || games.length === 0) {
    return (
      <VStack as="main" pt={20}>
        <Text>No games found.</Text>
      </VStack>
    );
  }

  return (
    <VStack as="main" pt={20}>
      {games.map(game => (
        <Text key={game.id}>{game.id}</Text>
      ))}
    </VStack>
  );
}
