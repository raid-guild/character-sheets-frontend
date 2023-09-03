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
    <main>
      {isConnectedAndMount ? (
        <VStack as="main" pt={10} spacing={10}>
          <Button onClick={createGameModal.onOpen}>Create a Game</Button>
          {games.map(game => (
            <Text key={game.id}>{game.id}</Text>
          ))}
        </VStack>
      ) : (
        <Text align="center" pt={20}>
          Connect wallet to view your games.
        </Text>
      )}
      <CreateGameModal {...createGameModal} />
    </main>
  );
}
