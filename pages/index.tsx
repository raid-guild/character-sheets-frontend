import { Button, Flex, Heading, Text } from '@chakra-ui/react';
import NextLink from 'next/link';

import { CreateGameModal } from '@/components/Modals/CreateGameModal';
import { useGamesContext } from '@/contexts/GamesContext';

export default function Home(): JSX.Element {
  const { createGameModal } = useGamesContext();

  return (
    <Flex direction="column" pt="120px" px="10vw">
      <Heading fontSize="2xl">Eternalize your journey</Heading>
      <Text fontSize={{ base: 'xl', lg: '2xl' }} maxW="630px" mt="6" w="full">
        Build a character through your work as a web3 mercenary. Slay moloch,
        earn XP.
      </Text>
      <Flex direction={{ base: 'column', lg: 'row' }} mt="12">
        <Button
          as={NextLink}
          href="/all-games"
          mr={{ base: '0', lg: '15px' }}
          mt={{ base: '10px', lg: '0' }}
          size="lg"
        >
          Browse games
        </Button>
        <Button onClick={createGameModal?.onOpen} size="lg">
          Create game
        </Button>
      </Flex>
      {createGameModal && <CreateGameModal />}
    </Flex>
  );
}
