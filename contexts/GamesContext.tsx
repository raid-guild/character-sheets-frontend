import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { CombinedError } from 'urql';
import { useAccount } from 'wagmi';

import { useGetGamesQuery } from '@/graphql/autogen/types';
import { GameMeta } from '@/utils/types';
import { formatGameMeta } from '@/utils/helpers';

type GamesContextType = {
  allGames: GameMeta[] | null;
  myGames: GameMeta[] | null;
  loading: boolean;
  error: CombinedError | undefined;
  reload: () => void;
};

const GamesContext = createContext<GamesContextType>({
  allGames: null,
  myGames: null,
  loading: false,
  error: undefined,
  reload: () => {},
});

export const useGamesContext = (): GamesContextType => useContext(GamesContext);

export const GamesProvider: React.FC<{
  children: JSX.Element;
}> = ({ children }) => {
  const { address } = useAccount();
  const [allGames, setAllGames] = useState<GameMeta[] | null>(null);
  const [myGames, setMyGames] = useState<GameMeta[] | null>(null);
  const [isFormatting, setIsFormatting] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);

  const [{ data, fetching, error }, reload] = useGetGamesQuery({
    requestPolicy: 'cache-and-network',
    variables: {
      limit: 100,
      skip: 0,
    },
  });

  const formatGames = useCallback(async () => {
    setIsFormatting(true);
    const formattedGames = await Promise.all(
      data?.games.map(g => formatGameMeta(g)) ?? [],
    );
    if (address) {
      const gamesByMaster = formattedGames.filter(g =>
        g.masters.includes(address),
      );
      setMyGames(gamesByMaster);
    }
    setAllGames(formattedGames);
    setIsFormatting(false);
    setIsRefetching(false);
  }, [address, data]);

  const refetch = useCallback(async () => {
    setIsRefetching(true);
    reload();
  }, [reload]);

  useEffect(() => {
    if (data?.games) {
      formatGames();
    }
  }, [data, formatGames]);

  return (
    <GamesContext.Provider
      value={{
        allGames,
        myGames,
        loading: fetching || isFormatting || isRefetching,
        error,
        reload: refetch,
      }}
    >
      {children}
    </GamesContext.Provider>
  );
};
