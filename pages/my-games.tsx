import { Button, Spinner, Text, VStack } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

import { GameCard } from '@/components/GameCard';
import { CreateGameModal } from '@/components/Modals/CreateGameModal';
import { useGamesContext } from '@/contexts/GamesContext';

export default function MyGames(): JSX.Element {
  const { isConnected } = useAccount();
  const { createGameModal, loading, myGames } = useGamesContext();

  const [isConnectedAndMount, setIsConnectedAndMounted] = useState(false);

  useEffect(() => {
    if (isConnected) {
      setIsConnectedAndMounted(true);
    } else {
      setIsConnectedAndMounted(false);
    }
  }, [isConnected]);

  const content = () => {
    if (!isConnectedAndMount) {
      return (
        <VStack>
          <Text align="center">Connect wallet to view your games.</Text>
        </VStack>
      );
    }

    if (loading) {
      return (
        <VStack>
          <Spinner size="lg" />
        </VStack>
      );
    }

    return (
      <VStack spacing={10}>
        <Button size="lg" onClick={createGameModal?.onOpen}>
          Create Game
        </Button>
        {!myGames || myGames.length === 0 ? (
          <VStack pt={10}>
            <Text>No games found.</Text>
          </VStack>
        ) : (
          <VStack spacing={10} w="100%">
            {myGames.map(game => (
              <GameCard key={game.id} {...game} />
            ))}
          </VStack>
        )}
      </VStack>
    );
  };

  return (
    <>
      {content()}
      {createGameModal && <CreateGameModal />}
    </>
  );
}
