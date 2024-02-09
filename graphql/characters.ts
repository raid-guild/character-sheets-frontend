import { formatFullCharacter } from '@/utils/helpers';
import { Character } from '@/utils/types';

import {
  CharacterInfoFragment,
  GetTopCharactersDocument,
  GetTopCharactersFromGameDocument,
} from './autogen/types';
import { getGraphClient } from './client';

export const getTopCharactersForChainId = async (
  chainId: number,
  limit: number,
  gameId?: string,
): Promise<{
  characters: Character[];
  error: Error | undefined;
}> => {
  try {
    const { data, error } = await getGraphClient(chainId).query(
      gameId ? GetTopCharactersFromGameDocument : GetTopCharactersDocument,
      {
        limit,
        gameId: gameId?.toLowerCase(),
      },
      {},
    );

    const characters = await Promise.all(
      data?.characters.map((character: CharacterInfoFragment) =>
        formatFullCharacter(character, chainId),
      ) || [],
    );

    return {
      characters,
      error,
    };
  } catch (e) {
    console.error('Error fetching top characters for chainId', chainId, e);
    return {
      characters: [],
      error: e as Error,
    };
  }
};
