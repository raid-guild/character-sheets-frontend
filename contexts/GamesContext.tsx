import { useDisclosure } from '@chakra-ui/react';
import { createContext, useContext, useMemo } from 'react';
import { useAccount } from 'wagmi';

import { GameMeta } from '@/utils/types';
import { useGames } from '@/hooks/useGames';

type GamesContextType = {
  allGames: GameMeta[] | null;
  myGames: GameMeta[] | null;
  loading: boolean;
  error: Error | undefined;
  reload: () => void;
  createGameModal: ReturnType<typeof useDisclosure> | undefined;
};

const GamesContext = createContext<GamesContextType>({
  allGames: null,
  myGames: null,
  loading: false,
  error: undefined,
  reload: () => {},
  createGameModal: undefined,
});

export const useGamesContext = (): GamesContextType => useContext(GamesContext);

export const GamesProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { address } = useAccount();

  const createGameModal = useDisclosure();

  const { games: allGames, error, loading, reload } = useGames();

  const myGames = useMemo(() => {
    if (!allGames || !address) return null;
    return allGames.filter(
      g =>
        g.owner === address.toLowerCase() ||
        g.admins.includes(address.toLowerCase()) ||
        g.masters.includes(address.toLowerCase()) ||
        g.players.includes(address.toLowerCase()),
    );
  }, [allGames, address]);

  return (
    <GamesContext.Provider
      value={{
        allGames,
        myGames,
        loading,
        error,
        reload,
        createGameModal,
      }}
    >
      {children}
    </GamesContext.Provider>
  );
};
