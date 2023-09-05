import { Button, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

import { CreateGameModal } from '@/components/Modals/CreateGameModal';
import { useGamesByOwner } from '@/hooks/useGames';

export default function MyGames(): JSX.Element {
  const { address, isConnected } = useAccount();
  const createGameModal = useDisclosure();
  const { games, loading } = useGamesByOwner(address || '');

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
        {!games || games.length === 0 ? (
          <VStack as="main" pt={10}>
            <Text>No games found.</Text>
          </VStack>
        ) : (
          games.map(game => <Text key={game.id}>{game.id}</Text>)
        )}
      </VStack>
      <CreateGameModal {...createGameModal} />
    </>
  );
}
