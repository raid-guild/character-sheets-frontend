import { useDisclosure } from '@chakra-ui/react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { CombinedError } from 'urql';
import { useAccount } from 'wagmi';

import { useGetGamesQuery } from '@/graphql/autogen/types';
import { formatGameMeta } from '@/utils/helpers';
import { GameMeta } from '@/utils/types';

type GamesContextType = {
  allGames: GameMeta[] | null;
  myGames: GameMeta[] | null;
  loading: boolean;
  error: CombinedError | undefined;
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

export const GamesProvider: React.FC<{
  children: JSX.Element;
}> = ({ children }) => {
  const { address } = useAccount();

  const createGameModal = useDisclosure();

  const [allGames, setAllGames] = useState<GameMeta[] | null>(null);
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
    setAllGames(formattedGames);
    setIsFormatting(false);
    setIsRefetching(false);
  }, [data]);

  const refetch = useCallback(async () => {
    setIsRefetching(true);
    reload();
  }, [reload]);

  useEffect(() => {
    if (data?.games) {
      formatGames();
    }
  }, [data, formatGames]);

  const myGames = useMemo(() => {
    if (!allGames || !address) return null;
    return allGames.filter(
      g =>
        g.masters.includes(address.toLowerCase()) ||
        g.players.includes(address.toLowerCase()),
    );
  }, [allGames, address]);

  return (
    <GamesContext.Provider
      value={{
        allGames,
        myGames,
        loading: fetching || isFormatting || isRefetching,
        error,
        reload: refetch,
        createGameModal,
      }}
    >
      {children}
    </GamesContext.Provider>
  );
};
