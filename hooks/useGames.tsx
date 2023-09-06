import { useCallback, useEffect, useState } from 'react';
import { CombinedError } from 'urql';

import { formatGame } from '@/contexts/GamesContext';
import {
  useGetGamesByMasterQuery,
  useGetGamesByOwnerQuery,
  useGetGamesQuery,
} from '@/graphql/autogen/types';
import { Game } from '@/utils/types';

export const useGames = (): {
  games: Game[] | null;
  loading: boolean;
  error: CombinedError | undefined;
  reload: () => void;
} => {
  const [games, setGames] = useState<Game[] | null>(null);
  const [isFormatting, setIsFormatting] = useState(false);

  const [{ data, fetching, error }, reload] = useGetGamesQuery({
    variables: {
      limit: 100,
      skip: 0,
    },
  });

  const formatGames = useCallback(async () => {
    setIsFormatting(true);
    const formattedGames = await Promise.all(
      data?.games.map(g => formatGame(g)) ?? [],
    );
    setGames(formattedGames);
    setIsFormatting(false);
  }, [data]);

  useEffect(() => {
    if (data?.games) {
      formatGames();
    }
  }, [data, formatGames]);

  if (!data?.games) {
    return { games: null, loading: fetching, error, reload };
  }

  return {
    games,
    loading: fetching || isFormatting,
    error,
    reload,
  };
};

export const useGamesByOwner = (
  owner: string,
): {
  games: Game[] | null;
  loading: boolean;
  error: CombinedError | undefined;
  reload: () => void;
} => {
  const [games, setGames] = useState<Game[] | null>(null);
  const [isFormatting, setIsFormatting] = useState(false);

  const [{ data, fetching, error }, reload] = useGetGamesByOwnerQuery({
    variables: {
      owner: owner.toLowerCase(),
      limit: 100,
      skip: 0,
    },
  });

  const formatGames = useCallback(async () => {
    setIsFormatting(true);
    const formattedGames = await Promise.all(
      data?.games.map(g => formatGame(g)) ?? [],
    );
    setGames(formattedGames);
    setIsFormatting(false);
  }, [data]);

  useEffect(() => {
    if (data?.games) {
      formatGames();
    }
  }, [data, formatGames]);

  if (!data?.games) {
    return { games: null, loading: fetching, error, reload };
  }

  return {
    games,
    loading: fetching || isFormatting,
    error,
    reload,
  };
};

export const useGamesByMaster = (
  master: string,
): {
  games: Game[] | null;
  loading: boolean;
  error: CombinedError | undefined;
  reload: () => void;
} => {
  const [games, setGames] = useState<Game[] | null>(null);
  const [isFormatting, setIsFormatting] = useState(false);

  const [{ data, fetching, error }, reload] = useGetGamesByMasterQuery({
    variables: {
      master: master.toLowerCase(),
      limit: 100,
      skip: 0,
    },
  });

  const formatGames = useCallback(async () => {
    setIsFormatting(true);
    const formattedGames = await Promise.all(
      data?.games.map(g => formatGame(g)) ?? [],
    );
    setGames(formattedGames);
    setIsFormatting(false);
  }, [data]);

  useEffect(() => {
    if (data?.games) {
      formatGames();
    }
  }, [data, formatGames]);

  if (!data?.games) {
    return { games: null, loading: fetching, error, reload };
  }

  return {
    games,
    loading: fetching || isFormatting,
    error,
    reload,
  };
};
