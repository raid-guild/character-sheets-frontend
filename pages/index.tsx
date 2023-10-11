import { Button, Flex, Heading, Text } from '@chakra-ui/react';
import NextLink from 'next/link';

import { CreateGameModal } from '@/components/Modals/CreateGameModal';
import { useGamesContext } from '@/contexts/GamesContext';

export default function Home(): JSX.Element {
  const { createGameModal } = useGamesContext();

  return (
    <Flex direction="column" pt="100px" px="10vw">
      <Heading fontSize="66px" lineHeight="56px" fontWeight={"regular"} textTransform={"capitalize"} maxW={"720px"}>Eternalize your journey</Heading>
      <Text fontSize={{ base: 'lg', lg: 'md' }} maxW="520px" mt="10" w="full">
        Build your character as a live chronicle of your actions. Collect items, earn XP and level up classes to register your  growth on-chain.
      </Text>
      <Flex direction={{ base: 'column', lg: 'row' }} mt="10">
        <Button
          as={NextLink}
          href="/all-games"
          mr={{ base: '0', lg: '15px' }}
          mt={{ base: '10px', lg: '0' }}
          size="lg"
          variant={"solid"}
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
