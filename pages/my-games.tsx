import { Button, Spinner, Text, VStack } from '@chakra-ui/react';
import { useCallback } from 'react';
import { useNetwork } from 'wagmi';

import { GameCard } from '@/components/GameCard';
import { CreateGameModal } from '@/components/Modals/CreateGameModal';
import { useGamesContext } from '@/contexts/GamesContext';
import { useIsConnectedAndMounted } from '@/hooks/useIsConnectedAndMounted';
import { useToast } from '@/hooks/useToast';
import { isSupportedChain } from '@/lib/web3';

export default function MyGames(): JSX.Element {
  const { chain } = useNetwork();
  const { createGameModal, loading, myGames } = useGamesContext();
  const { renderError } = useToast();

  const isConnectedAndMounted = useIsConnectedAndMounted();

  const startCreateGame = useCallback(() => {
    if (!chain) {
      renderError('Please connect your wallet');
      return;
    }
    if (!isSupportedChain(chain.id)) {
      renderError('Please switch to a supported network');
      return;
    }
    createGameModal?.onOpen();
  }, [chain, createGameModal, renderError]);

  const content = () => {
    if (!isConnectedAndMounted) {
      return (
        <VStack>
          <Text align="center">Connect wallet to view your games.</Text>
        </VStack>
      );
    }

    if (loading) {
      return (
        <VStack>
          <Spinner size="lg" />
        </VStack>
      );
    }

    return (
      <VStack spacing={10}>
        <Button size="lg" onClick={startCreateGame}>
          Create Game
        </Button>
        {!myGames || myGames.length === 0 ? (
          <VStack pt={10}>
            <Text>No games found.</Text>
          </VStack>
        ) : (
          <VStack spacing={10} w="100%">
            {myGames.map(game => (
              <GameCard key={game.id} {...game} />
            ))}
          </VStack>
        )}
      </VStack>
    );
  };

  return (
    <>
      {content()}
      {createGameModal && <CreateGameModal />}
    </>
  );
}
