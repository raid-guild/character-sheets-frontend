import { useCallback, useEffect, useState } from 'react';

import { getTopCharactersForChainId } from '@/graphql/characters';
import { getChainIdFromLabel, SUPPORTED_CHAINS } from '@/lib/web3';
import {
  ENVIRONMENT,
  RAIDGUILD_GAME_ADDRESS,
  RAIDGUILD_GAME_CHAIN_LABEL,
} from '@/utils/constants';
import { Character } from '@/utils/types';

export const getTopCharacters = async (
  limit: number,
  gameId?: string,
): Promise<{
  characters: Character[];
  error: Error | undefined;
}> => {
  if (ENVIRONMENT === 'main') {
    const gameId = RAIDGUILD_GAME_ADDRESS?.toLowerCase();
    const chainId = RAIDGUILD_GAME_CHAIN_LABEL
      ? getChainIdFromLabel(RAIDGUILD_GAME_CHAIN_LABEL)
      : undefined;

    if (gameId && chainId) {
      const { characters: sortedTopCharacters, error: _error } =
        await getTopCharactersForChainId(chainId, limit, gameId);

      return {
        characters: sortedTopCharacters,
        error: _error,
      };
    }
  }

  const results = await Promise.all(
    SUPPORTED_CHAINS.map(chain =>
      getTopCharactersForChainId(chain.id, limit, gameId),
    ),
  );

  const { characters: _characters, error: _error } = results.reduce(
    (acc, result) => {
      acc.characters.push(...result.characters);
      acc.error = acc.error || result.error;
      return acc;
    },
    { characters: [], error: undefined },
  );

  const sortedTopCharacters = _characters.sort((a, b) => {
    const expA = a.experience;
    const expB = b.experience;

    if (expA < expB) {
      return 1;
    } else if (expA > expB) {
      return -1;
    }
    return 0;
  });
  return {
    characters: sortedTopCharacters,
    error: _error,
  };
};

export const useTopCharacters = (
  limit: number,
): {
  characters: Character[] | null;
  loading: boolean;
  error: Error | undefined;
  reload: () => void;
} => {
  const [characters, setTopCharacters] = useState<Character[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [refreshCount, setRefreshCount] = useState<number>(0);

  const reload = useCallback(() => {
    setRefreshCount(count => count + 1);
  }, []);

  const fetchTopCharacters = useCallback(async () => {
    setLoading(true);

    const { characters: sortedTopCharacters, error: _error } =
      await getTopCharacters(limit);
    setTopCharacters(sortedTopCharacters);
    setError(_error);
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    fetchTopCharacters();
  }, [fetchTopCharacters, refreshCount]);

  return {
    characters,
    loading,
    error,
    reload,
  };
};
