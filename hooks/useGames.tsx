import { CombinedError } from 'urql';

import {
  GameInfoFragment,
  useGetGamesByOwnerQuery,
  useGetGamesQuery,
} from '@/graphql/autogen/types';

export const useGames = (): {
  games: GameInfoFragment[] | undefined;
  loading: boolean;
  error: CombinedError | undefined;
  reload: () => void;
} => {
  const [{ data, fetching, error }, reload] = useGetGamesQuery({
    variables: {
      limit: 100,
      skip: 0,
    },
  });

  return { games: data?.games, loading: fetching, error, reload };
};

export const useGamesByOwner = (
  owner: string,
): {
  games: GameInfoFragment[] | undefined;
  loading: boolean;
  error: CombinedError | undefined;
  reload: () => void;
} => {
  const [{ data, fetching, error }, reload] = useGetGamesByOwnerQuery({
    variables: {
      owner,
      limit: 100,
      skip: 0,
    },
  });

  return { games: data?.games, loading: fetching, error, reload };
};
