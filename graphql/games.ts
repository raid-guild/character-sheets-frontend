import { formatGame, formatGameMeta } from '@/utils/helpers';
import { Game, GameMeta } from '@/utils/types';

import {
  FullGameInfoFragment,
  GameMetaInfoFragment,
  GetGameDocument,
  GetGamesDocument,
} from './autogen/types';
import { getGraphClient } from './client';

export const getGamesForChainId = async (
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

export const getGameForChainId = async (
  chainId: number,
  gameId: string,
): Promise<Game | null> => {
  const { data, error } = await getGraphClient(chainId).query(GetGameDocument, {
    gameId: gameId.toLowerCase(),
  });

  if (error) {
    console.error('Error getting game', error);
    return null;
  }

  const game = data?.game as FullGameInfoFragment | undefined;

  if (!game) {
    console.error('Game not found');
    return null;
  }

  return formatGame(game);
};
