import { useCallback, useEffect, useState } from 'react';

import {
  GameMetaInfoFragment,
  GetGamesDocument,
} from '@/graphql/autogen/types';
import { getGraphClient } from '@/graphql/client';
import { SUPPORTED_CHAINS } from '@/lib/web3';
import { formatGameMeta } from '@/utils/helpers';
import { GameMeta } from '@/utils/types';

const fetchGamesForChainId = async (
  chainId: number,
): Promise<{
  games: GameMeta[];
  error: Error | undefined;
}> => {
  try {
    const { data, error } = await getGraphClient(chainId).query(
      GetGamesDocument,
      {},
    );

    const games = await Promise.all(
      data?.games.map((game: GameMetaInfoFragment) => formatGameMeta(game)),
    );

    return {
      games: games || [],
      error,
    };
  } catch (e) {
    console.error('Error fetching games for chainId', chainId, e);
    return {
      games: [],
      error: e as Error,
    };
  }
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

    const results = await Promise.all(
      SUPPORTED_CHAINS.map(chain => fetchGamesForChainId(chain.id)),
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
