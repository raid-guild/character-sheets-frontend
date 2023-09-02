import { Flex, Text } from '@chakra-ui/react';

import { useGames } from '@/hooks/useGames';

export default function AllGames(): JSX.Element {
  const { games, loading } = useGames();

  if (loading || !games) return <Text>Loading...</Text>;

  return (
    <main>
      <Text align="center" pt={20}>
        {games.map(game => (
          <Flex key={game.id} align="center" justify="center">
            <Text>{game.id}</Text>
          </Flex>
        ))}
      </Text>
    </main>
  );
}
