import { Button, Flex, Text, useDisclosure } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

import { CreateGameModal } from '@/components/Modals/CreateGameModal';

export default function MyGames(): JSX.Element {
  const { isConnected } = useAccount();
  const createGameModal = useDisclosure();

  const [isConnectedAndMount, setIsConnectedAndMounted] = useState(false);

  useEffect(() => {
    if (isConnected) {
      setIsConnectedAndMounted(true);
    } else {
      setIsConnectedAndMounted(false);
    }
  }, [isConnected]);

  return (
    <main>
      {isConnectedAndMount ? (
        <Flex justify="center" pt={10}>
          <Button onClick={createGameModal.onOpen}>Create a Game</Button>
        </Flex>
      ) : (
        <Text align="center" pt={20}>
          Connect wallet to view your games.
        </Text>
      )}
      <CreateGameModal {...createGameModal} />
    </main>
  );
}
