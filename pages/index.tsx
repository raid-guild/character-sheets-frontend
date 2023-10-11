import { Box, Button, Flex, HStack, Heading, Image, Link, Text, VStack } from '@chakra-ui/react';
import NextLink from 'next/link';

import { CreateGameModal } from '@/components/Modals/CreateGameModal';
import { useGamesContext } from '@/contexts/GamesContext';
import { CharacterCard } from '@/components/CharacterCard';

export default function Home(): JSX.Element {
  const { createGameModal } = useGamesContext();

  return (
    <Flex
      direction="column"
      py="100px"
      px="10vw"
      backgroundImage="url('/RG_CS_bg.png')"
      backgroundPosition="0 -20vh"
      backgroundRepeat="no-repeat"
      backgroundSize="100%"
    >
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
      <Text color={'whiteAlpha.700'} mt={20} mb={6} fontSize={"14px"} textTransform={"uppercase"}>Most recent :</Text>

      {/* This could be Charactercard? */}
      <HStack
        w={'full'}
        maxW={"900px"}
        border={"1px solid white"}
        p={5}
        align={"stretch"}
        flexWrap={"wrap"}
      >
      <Image
          alt="character avatar"
          w="358px"
          minW="358px"
          h="474px"
          rounded={10}
          objectFit="cover"
          src="/RG_CharacterSheet_CharacterBuild__v3_ex2.png"
        />
        <VStack flex={1} align={"start"} justify={"start"} pt={8} pl={10} pr={6} spacing={0}>
          <Heading _hover={{color:"accent", cursor:"pointer"}}>McLizard the Hizard</Heading>
          <Link
            fontSize="sm"
            href={`/`}
            isExternal
            fontWeight={300}
          >
            0xIIO...mlmz
          </Link>
          <HStack spacing={4} mt={6} mb={8} flexWrap={"wrap"}>
            {/* Maybe this is a Classtag? */}
            <HStack spacing={0}>
              <Box h={"22px"} w={"6px"} bg={"softgreen"} m={0}></Box>
              <Text bg={"softgreen"} color={"dark"} fontWeight={"bold"} fontSize={"sm"} py={2} px={8}>Wizard</Text>
              <Box h={"22px"} w={"6px"} bg={"softgreen"}></Box>
            </HStack>
            {/* Here is the next one: */}
            <HStack spacing={0}>
              <Box h={"22px"} w={"6px"} bg={"softpurple"} m={0}></Box>
              <Text bg={"softpurple"} color={"dark"} fontWeight={"bold"} fontSize={"sm"} py={2} px={8}>Villager</Text>
              <Box h={"22px"} w={"6px"} bg={"softpurple"}></Box>
            </HStack>
          </HStack>
          
          <VStack spacing={0}>
            <Flex direction="row" align="center" py={2}>
              <Image alt="users" height="20px" src="/icons/xp.svg" width="20px" />
              <Text ml="4" fontSize="lg" fontWeight="400">
                800 XP
              </Text>
            </Flex>
            <Flex direction="row" align="center" py={2}>
              <Image alt="users" height="20px" src="/icons/items.svg" width="20px" />
              <Text ml="4" fontSize="lg" fontWeight="400">
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
