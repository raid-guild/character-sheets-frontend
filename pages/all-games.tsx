import { Flex, Text, VStack } from '@chakra-ui/react';
import { useNetwork } from 'wagmi';

import { GameCard } from '@/components/GameCard';
import { useGamesContext } from '@/contexts/GamesContext';
import { DEFAULT_CHAIN } from '@/lib/web3';

export default function AllGames(): JSX.Element {
  const { allGames, loading } = useGamesContext();
  const { chain } = useNetwork();

  if (loading) {
    return (
      <VStack as="main" pt={20}>
        <Text>Loading...</Text>
      </VStack>
    );
  }

  if (!allGames || allGames.length === 0) {
    return (
      <VStack as="main" pt={20}>
        <Text>No games found.</Text>
      </VStack>
    );
  }

  return (
    <VStack as="main" pt={14} pb={20} spacing={10}>
      <Flex gap={10} justify="center" w="full" wrap="wrap">
        {allGames.map(game => (
          <GameCard
            key={game.id}
            chainId={chain?.id ?? DEFAULT_CHAIN.id}
            {...game}
          />
        ))}
      </Flex>
    </VStack>
  );
}
