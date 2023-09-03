import { Flex, Link, Text, VStack } from '@chakra-ui/react';
import NextLink from 'next/link';

export default function Home(): JSX.Element {
  return (
    <VStack as="main" pt={20}>
      <Text fontSize="2xl" variant="heading">
        CharacterSheets
      </Text>
      <Text pt={4}>
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
    </VStack>
  );
}
