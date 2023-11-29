import { Game, GameMeta } from '@/utils/types';
import {
  FullGameInfoFragment,
  GameMetaInfoFragment,
  GetGameDocument,
  GetGamesDocument,
} from './autogen/types';
import { getGraphClient } from './client';
import { formatGame, formatGameMeta } from '@/utils/helpers';

export const getGamesForChainId = async (
  chainId: number,
): Promise<Array<GameMeta>> => {
  const { data, error } = await getGraphClient(chainId).query(
    GetGamesDocument,
    {
      limit: 1000,
      skip: 0,
    },
  );

  if (error) {
    console.error('Error getting game masters', error);
    return [];
  }

  const games = data?.games as Array<GameMetaInfoFragment> | undefined;

  if (!games) {
    console.error('Games not found');
    return [];
  }

  return Promise.all(games.map(g => formatGameMeta(g)));
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
