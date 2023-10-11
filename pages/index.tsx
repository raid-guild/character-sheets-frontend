import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Image,
  Link,
  Text,
  VStack,
} from '@chakra-ui/react';
import NextLink from 'next/link';

import { CreateGameModal } from '@/components/Modals/CreateGameModal';
import { useGamesContext } from '@/contexts/GamesContext';

export default function Home(): JSX.Element {
  const { createGameModal } = useGamesContext();

  return (
    <Flex
      backgroundImage="url('/RG_CS_bg.png')"
      backgroundPosition="0 -20vh"
      backgroundRepeat="no-repeat"
      backgroundSize="100%"
      direction="column"
      py="100px"
      px="10vw"
    >
      <Heading
        fontSize="66px"
        lineHeight="56px"
        maxW="720px"
        textTransform="capitalize"
      >
        Eternalize your journey
      </Heading>
      <Text fontSize={{ base: 'lg', lg: 'md' }} mt="10" maxW="520px" w="full">
        Build your character as a live chronicle of your actions. Collect items,
        earn XP and level up classes to register your growth on-chain.
      </Text>
      <Flex direction={{ base: 'column', lg: 'row' }} mt="10">
        <Button
          as={NextLink}
          href="/all-games"
          mr={{ base: '0', lg: '15px' }}
          mt={{ base: '10px', lg: '0' }}
          size="lg"
          variant="solid"
        >
          Browse games
        </Button>
        <Button onClick={createGameModal?.onOpen} size="lg">
          Create game
        </Button>
      </Flex>
      <Text
        color="whiteAlpha.700"
        fontSize="14px"
        mt={20}
        mb={6}
        textTransform="uppercase"
      >
        Most recent :
      </Text>

      {/* TODO: This could be Charactercard? */}
      <HStack
        align="stretch"
        border="1px solid white"
        flexWrap="wrap"
        maxW="900px"
        p={5}
        w="full"
      >
        <Image
          alt="character avatar"
          h="474px"
          minW="358px"
          objectFit="cover"
          rounded={10}
          src="/RG_CharacterSheet_CharacterBuild__v3_ex2.png"
          w="358px"
        />
        <VStack
          align="start"
          flex={1}
          justify="start"
          pl={10}
          pr={6}
          pt={8}
          spacing={0}
        >
          <Heading _hover={{ color: 'accent', cursor: 'pointer' }}>
            McLizard the Hizard
          </Heading>
          <Link fontSize="sm" href="/" isExternal fontWeight={300}>
            0xaBc...123
          </Link>
          <HStack flexWrap="wrap" mt={6} mb={8} spacing={4}>
            {/* TODO: Maybe this is a Classtag? */}
            <HStack spacing={0}>
              <Box bg="softgreen" h="22px" w="6px" />
              <Text
                bg="softgreen"
                color="dark"
                fontSize="sm"
                fontWeight="bold"
                py={2}
                px={8}
              >
                Wizard
              </Text>
              <Box bg="softgreen" h="22px" w="6px" />
            </HStack>
            <HStack spacing={0}>
              <Box bg="softpurple" h="22px" m={0} w="6px" />
              <Text
                bg="softpurple"
                color="dark"
                fontSize="sm"
                fontWeight="bold"
                py={2}
                px={8}
              >
                Villager
              </Text>
              <Box bg="softpurple" h="22px" w="6px" />
            </HStack>
          </HStack>

          <VStack spacing={0}>
            <Flex align="center" direction="row" py={2}>
              <Image
                alt="users"
                height="20px"
                src="/icons/xp.svg"
                width="20px"
              />
              <Text fontSize="lg" fontWeight="400" ml="4">
                800 XP
              </Text>
            </Flex>
            <Flex align="center" direction="row" py={2}>
              <Image
                alt="users"
                height="20px"
                src="/icons/items.svg"
                width="20px"
              />
              <Text fontSize="lg" fontWeight="400" ml="4">
                12 items
              </Text>
            </Flex>
          </VStack>
        </VStack>
      </HStack>

      {createGameModal && <CreateGameModal />}
    </Flex>
  );
}
