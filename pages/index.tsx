import { Button, Flex, Heading, Text, VStack } from '@chakra-ui/react';
import { GetStaticProps, InferGetStaticPropsType } from 'next';
import NextLink from 'next/link';
import { useAccount } from 'wagmi';

import { CharacterCard } from '@/components/CharacterCard';
import { CreateGameModal } from '@/components/Modals/CreateGameModal';
import { useGamesContext } from '@/contexts/GamesContext';
import { useToast } from '@/hooks/useToast';
import { getTopCharacters } from '@/hooks/useTopCharacters';

type Props = InferGetStaticPropsType<typeof getStaticProps>;

export default function Home({ character }: Props): JSX.Element {
  const { createGameModal } = useGamesContext();
  const { address } = useAccount();
  const { renderError } = useToast();

  return (
    <Flex
      backgroundImage="url('/RG_CS_bg.png')"
      backgroundPosition="0 -20vh"
      backgroundRepeat="no-repeat"
      backgroundSize="100%"
      direction="column"
      py="100px"
      px={{ base: 4, lg: '10vw' }}
    >
      <VStack spacing={0} align="start" maxW="100rem" w="100%" mx="auto">
        <Heading
          fontSize={{
            base: '48px',
            md: '66px',
          }}
          lineHeight="56px"
          maxW="720px"
          textTransform="capitalize"
        >
          Eternalize your journey
        </Heading>
        <Text fontSize={{ base: 'lg', lg: 'md' }} mt="10" maxW="520px" w="full">
          Build your character as a live chronicle of your actions. Collect
          items, earn XP and level up classes to register your growth on-chain.
        </Text>
        <Flex
          direction={{ base: 'column', lg: 'row' }}
          mt="10"
          mx={{ base: 'auto', lg: '0' }}
        >
          <Button
            as={NextLink}
            href="/all-games"
            mr={{ base: '0', lg: '15px' }}
            size="lg"
            variant="solid"
          >
            Browse games
          </Button>
          <Button
            onClick={() => {
              if (!address) {
                renderError('Please connect your wallet first');
                return;
              }
              createGameModal?.onOpen();
            }}
            size="lg"
            mt={{ base: '10px', lg: '0' }}
          >
            Create game
          </Button>
        </Flex>
        {character && (
          <>
            <Text
              color="whiteAlpha.700"
              fontSize="14px"
              mt={20}
              mb={6}
              textTransform="uppercase"
            >
              Featured :
            </Text>

            <CharacterCard
              character={character}
              chainId={character.chainId}
              displayOnly
            />
          </>
        )}
      </VStack>

      {createGameModal && <CreateGameModal />}
    </Flex>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const { characters } = await getTopCharacters(1);
  return {
    props: {
      character: characters?.[0] || null,
    },
    revalidate: 86400, // every 24 hours
  };
};
