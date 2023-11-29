import { useCallback, useEffect, useState } from 'react';

import { SUPPORTED_CHAINS } from '@/lib/web3';
import { GameMeta } from '@/utils/types';
import { getGamesForChainId } from '@/graphql/games';

export const getAllGames = async (): Promise<{
  games: GameMeta[];
  error: Error | undefined;
}> => {
  const results = await Promise.all(
    SUPPORTED_CHAINS.map(chain => getGamesForChainId(chain.id)),
  );

  const { games: _games, error: _error } = results.reduce(
    (acc, result) => {
      acc.games.push(...result.games);
      acc.error = acc.error || result.error;
      return acc;
    },
    { games: [], error: undefined },
  );

  const sortedGames = _games.sort((a, b) => {
    const startDateA = new Date(a.startedAt).getTime();
    const startDateB = new Date(b.startedAt).getTime();

    if (startDateA < startDateB) {
      return 1;
    } else if (startDateA > startDateB) {
      return -1;
    } else {
      return 0;
    }
  });
  return {
    games: sortedGames,
    error: _error,
  };
};

export const useGames = (): {
  games: GameMeta[] | null;
  loading: boolean;
  error: Error | undefined;
  reload: () => void;
} => {
  const [games, setGames] = useState<GameMeta[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [refreshCount, setRefreshCount] = useState<number>(0);

  const reload = useCallback(() => {
    setRefreshCount(count => count + 1);
  }, []);

  const fetchGames = useCallback(async () => {
    setLoading(true);

    const { games: sortedGames, error: _error } = await getAllGames();
    setGames(sortedGames);
    setError(_error);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchGames();
  }, [fetchGames, refreshCount]);

  return {
    games,
    loading,
    error,
    reload,
  };
};
