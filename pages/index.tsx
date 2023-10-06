import { Button, Flex, Heading, Text } from '@chakra-ui/react';
import NextLink from 'next/link';

export default function Home(): JSX.Element {
  return (
    <Flex direction="column" pt="120px" px="10vw">
      <Heading
        w="full"
        maxW="600px"
        size={{ base: '3xl', lg: '4xl' }}
        variant="noShadow"
      >
        Eternalize your journey
      </Heading>
      <Text
        w="full"
        maxW="630px"
        color="white"
        fontSize={{ base: 'xl', lg: '2xl' }}
        mt="6"
      >
        Build a character through your work as a web3 mercenary. Slay moloch,
        earn XP.
      </Text>
      <Flex direction={{ base: 'column', lg: 'row' }} mt="12">
        <Button
          variant="solid"
          bg="primary.500"
          size="lg"
          mr={{ base: '0', lg: '15px' }}
          mt={{ base: '10px', lg: '0' }}
          as={NextLink}
          href="/all-games"
        >
          Browse games
        </Button>
        <Button
          variant="outline"
          borderColor="primary.500"
          size="lg"
          as={NextLink}
          href="/my-games"
        >
          Create game
        </Button>
      </Flex>
    </Flex>
    // <VStack as="main" pt={20}>
    //   <Text fontSize="2xl" variant="heading">
    //     CharacterSheets
    //   </Text>
    //   <Text pt={4}>
    //     Build a character through your work as a web3 mercenary. Slay moloch,
    //     earn XP.
    //   </Text>
    //   <Flex margin="60px auto 0" justify="space-between" width="280px" gap="4">
    //     <Button as={NextLink} href="/my-games">
    //       My Games
    //     </Button>
    //     <Button as={NextLink} href="/all-games">
    //       All Games
    //     </Button>
    //   </Flex>
    // </VStack>
  );
}
