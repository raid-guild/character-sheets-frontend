import { Button, Flex, Text, VStack } from '@chakra-ui/react';
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
      <Flex margin="60px auto 0" justify="space-between" width="280px" gap="4">
        <Button as={NextLink} href="/my-games">
          My Games
        </Button>
        <Button as={NextLink} href="/all-games">
          All Games
        </Button>
      </Flex>
    </VStack>
  );
}
