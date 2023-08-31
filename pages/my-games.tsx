import { Text } from '@chakra-ui/react';
import { useAccount } from 'wagmi';

export default function MyGames(): JSX.Element {
  const { isConnected } = useAccount();

  return (
    <main>
      {isConnected ? (
        <Text align="center" pt={20}>
          Your games!
        </Text>
      ) : (
        <Text align="center" pt={20}>
          Connect wallet to view your games.
        </Text>
      )}
    </main>
  );
}
