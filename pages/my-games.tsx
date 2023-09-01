import { Button, Flex, Text } from '@chakra-ui/react';
import { useAccount } from 'wagmi';

export default function MyGames(): JSX.Element {
  const { isConnected } = useAccount();

  return (
    <main>
      {isConnected ? (
        <Flex justify="center" pt={10}>
          <Button>Create a Game</Button>
        </Flex>
      ) : (
        <Text align="center" pt={20}>
          Connect wallet to view your games.
        </Text>
      )}
    </main>
  );
}
