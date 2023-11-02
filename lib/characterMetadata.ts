import { getAddress } from 'viem';

import { dbPromise } from '@/lib/mongodb';

export const getCharacterMetadata = async (
  unvalidatedCharacterId: string,
): Promise<null | string> => {
  try {
    const [_gameAddress, , _characterId] = unvalidatedCharacterId.split('-');
    const gameAddress = getAddress(_gameAddress);
    const characterId = BigInt(_characterId).toString();
    const validatedCharacterId = `${gameAddress}-character-${characterId}`;

    const client = await dbPromise;
    const result = await client.collection('characterMetadata').findOne({
      characterId: validatedCharacterId,
    });
    return result?.metadata ?? null;
  } catch (error) {
    console.error(error);
    return null;
  }
};
