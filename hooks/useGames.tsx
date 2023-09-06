import { useCallback, useEffect, useState } from 'react';
import { CombinedError } from 'urql';

import {
  GameInfoFragment,
  useGetGamesByOwnerQuery,
  useGetGamesQuery,
} from '@/graphql/autogen/types';
import { uriToHttp } from '@/utils/helpers';
import { Game, Metadata } from '@/utils/types';

const fetchMetadata = async (uri: string): Promise<Metadata> => {
  const res = await fetch(`${uri}/gameMetadata.json`);
  return await res.json();
};

const formatGame = async (game: GameInfoFragment): Promise<Game> => {
  const metadata = await fetchMetadata(uriToHttp(game.uri)[0]);

  return {
    id: game.id,
    uri: game.uri,
    name: metadata.name,
    description: metadata.description,
    image: metadata.image,
    characters: game.characters,
    classes: game.classes,
    items: game.items,
  };
};

export const useGames = (): {
  games: Game[] | null;
  loading: boolean;
  error: CombinedError | undefined;
  reload: () => void;
} => {
  const [games, setGames] = useState<Game[] | null>(null);

  const [{ data, fetching, error }, reload] = useGetGamesQuery({
    variables: {
      limit: 100,
      skip: 0,
    },
  });

  const formatGames = useCallback(async () => {
    const formattedGames = await Promise.all(
      data?.games.map(g => formatGame(g)) ?? [],
    );
    setGames(formattedGames);
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
    loading: fetching,
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

  const [{ data, fetching, error }, reload] = useGetGamesByOwnerQuery({
    variables: {
      owner,
      limit: 100,
      skip: 0,
    },
  });

  const formatGames = useCallback(async () => {
    const formattedGames = await Promise.all(
      data?.games.map(g => formatGame(g)) ?? [],
    );
    setGames(formattedGames);
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
    loading: fetching,
    error,
    reload,
  };
};
