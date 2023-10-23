import { Text, VStack } from '@chakra-ui/react';
import { useNetwork } from 'wagmi';

import { GameCard } from '@/components/GameCard';
import { useGamesContext } from '@/contexts/GamesContext';
import { DEFAULT_CHAIN } from '@/lib/web3';

export default function AllGames(): JSX.Element {
  const { allGames, loading } = useGamesContext();
  const { chain } = useNetwork();

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
        <GameCard
          key={game.id}
          chainId={chain?.id ?? DEFAULT_CHAIN.id}
          {...game}
        />
      ))}
    </VStack>
  );
}
