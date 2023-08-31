import { Flex, Link, Text } from '@chakra-ui/react';
import NextLink from 'next/link';

export default function Home(): JSX.Element {
  return (
    <main>
      <Text align="center" pt={20}>
        Build a character through your work as a web3 mercenary. Slay moloch,
        earn XP.
      </Text>
      <Flex margin="60px auto 0" justify="space-between" width="250px">
        <Link as={NextLink} borderBottom="2px solid black" href="/my-games">
          My Games
        </Link>
        <Link as={NextLink} borderBottom="2px solid black" href="/all-games">
          All Games
        </Link>
      </Flex>
    </main>
  );
}
