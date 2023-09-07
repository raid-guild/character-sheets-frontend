import {
  Button,
  HStack,
  Image,
  Link,
  SimpleGrid,
  Spinner,
  Text,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { isAddress } from 'viem';
import { useAccount, useNetwork } from 'wagmi';

import { CharacterCard } from '@/components/CharacterCard';
import { JoinGameModal } from '@/components/Modals/JoinGameModal';
import { GameProvider, useGame } from '@/contexts/GameContext';
import { DEFAULT_CHAIN } from '@/lib/web3';
import { EXPLORER_URLS } from '@/utils/constants';
import { shortenAddress, shortenText } from '@/utils/helpers';

export default function GamePageOuter(): JSX.Element {
  const {
    query: { gameId },
    push,
  } = useRouter();

  useEffect(() => {
    if (!gameId || typeof gameId !== 'string' || !isAddress(gameId)) {
      push('/');
    }
  }, [gameId, push]);

  return (
    <GameProvider gameId={gameId}>
      <GamePage />
    </GameProvider>
  );
}

function GamePage(): JSX.Element {
  const { game, character, loading } = useGame();
  const { isConnected } = useAccount();
  const joinGameModal = useDisclosure();
  const { chain } = useNetwork();

  const [isConnectedAndMount, setIsConnectedAndMounted] = useState(false);

  useEffect(() => {
    if (isConnected) {
      setIsConnectedAndMounted(true);
    } else {
      setIsConnectedAndMounted(false);
    }
  }, [isConnected]);

  const content = () => {
    if (loading) {
      return (
        <VStack as="main" pt={20}>
          <Spinner size="lg" />
        </VStack>
      );
    }

    if (!game) {
      return (
        <VStack as="main" pt={20}>
          <Text align="center">Game not found.</Text>
        </VStack>
      );
    }

    if (!isConnectedAndMount) {
      return (
        <VStack as="main" pt={20}>
          <Text align="center">Connect wallet to play this game.</Text>
        </VStack>
      );
    }

    const {
      experience,
      image,
      name,
      id,
      description,
      characters,
      classes,
      items,
    } = game;
    const chainId = chain?.id ?? DEFAULT_CHAIN.id;

    return (
      <VStack as="main" pt={10} pb={20} spacing={10} maxW="2xl" mx="auto">
        <HStack w="100%" justify="space-between" spacing={16}>
          <VStack align="stretch">
            <Text fontWeight="bold" fontSize="xl">
              {name}
            </Text>
            <Text as="span" fontSize="xs">
              {shortenText(description, 130)}
            </Text>
            <Link
              alignItems="center"
              color="blue"
              display="flex"
              fontSize="sm"
              gap={2}
              href={`${EXPLORER_URLS[chainId]}/address/${id}`}
              isExternal
            >
              {shortenAddress(id)}
              <Image
                alt="link to new tab"
                height="14px"
                src="/new-tab.svg"
                width="14px"
              />
            </Link>
          </VStack>
          <Image
            alt="game emblem"
            background="gray.400"
            h="140px"
            objectFit="cover"
            src={image}
          />
        </HStack>

        {character ? (
          <CharacterCard {...character} chainId={chainId} />
        ) : (
          <Button onClick={joinGameModal.onOpen}>Join this Game</Button>
        )}
        <SimpleGrid columns={2} spacing={4} w="100%">
          <VStack border="3px solid black" spacing={4} p={4}>
            <Text>{characters.length} Characters</Text>
          </VStack>
          <VStack border="3px solid black" spacing={4} p={4}>
            <Text>{experience} XP</Text>
          </VStack>
          <VStack border="3px solid black" spacing={4} p={4}>
            <Text>{classes.length} Classes</Text>
          </VStack>
          <VStack border="3px solid black" spacing={4} p={4}>
            <Text>{items.length} Items</Text>
          </VStack>
        </SimpleGrid>
      </VStack>
    );
  };

  return (
    <>
      {content()}
      <JoinGameModal {...joinGameModal} />
    </>
  );
}
