import { Button, Flex, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useAccount, useNetwork } from 'wagmi';

import { GameCard } from '@/components/GameCard';
import { CreateGameModal } from '@/components/Modals/CreateGameModal';
import { useGamesContext } from '@/contexts/GamesContext';

export default function MyGames(): JSX.Element {
  const { isConnected } = useAccount();
  const createGameModal = useDisclosure();
  const { allGames, loading } = useGamesContext();
  const { chain } = useNetwork();

  const [isConnectedAndMount, setIsConnectedAndMounted] = useState(false);

  useEffect(() => {
    if (isConnected) {
      setIsConnectedAndMounted(true);
    } else {
      setIsConnectedAndMounted(false);
    }
  }, [isConnected]);

  if (!isConnectedAndMount) {
    return (
      <VStack as="main" pt={20}>
        <Text align="center">Connect wallet to view your games.</Text>
      </VStack>
    );
  }

  if (loading) {
    return (
      <VStack as="main" pt={20}>
        <Text>Loading...</Text>
      </VStack>
    );
  }

  return (
    <>
      <VStack as="main" pt={10} spacing={10}>
        <Button onClick={createGameModal.onOpen}>Create a Game</Button>
        {!allGames || allGames.length === 0 ? (
          <VStack as="main" pt={10}>
            <Text>No games found.</Text>
          </VStack>
        ) : (
          <Flex gap={10} justify="center" w="1200px" wrap="wrap">
            {allGames.map(game => (
              <GameCard
                key={game.id}
                chainId={chain?.id ?? 11155111}
                {...game}
              />
            ))}
          </Flex>
        )}
      </VStack>
      <CreateGameModal {...createGameModal} />
    </>
  );
}
