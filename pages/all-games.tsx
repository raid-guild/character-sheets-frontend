import { Text, VStack } from '@chakra-ui/react';
import { GetStaticProps, InferGetStaticPropsType } from 'next';

import { GameCard } from '@/components/GameCard';
import { useGamesContext } from '@/contexts/GamesContext';
import { getAllGames } from '@/hooks/useGames';
import { GameMeta } from '@/utils/types';

type Props = InferGetStaticPropsType<typeof getStaticProps>;

export default function AllGames({ games: staticGames }: Props): JSX.Element {
  const { allGames, loading } = useGamesContext();

  const games: GameMeta[] | null =
    !!allGames && allGames.length > 0 ? allGames : staticGames;

  if (!games || games.length === 0) {
    if (loading) {
      return (
        <VStack>
          <Text>Loading...</Text>
        </VStack>
      );
    }

    return (
      <VStack>
        <Text>No games found.</Text>
      </VStack>
    );
  }

  return (
    <VStack spacing={10}>
      {games.map(game => (
        <GameCard key={game.id} {...game} />
      ))}
    </VStack>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const { games } = await getAllGames();
  return {
    props: {
      games,
    },
    revalidate: 60,
  };
};
