import { getAddress } from 'viem';

import { dbPromise } from '@/lib/mongodb';
import { CharacterMetaDB } from '@/utils/types';

export const getCharacterMetaFromDB = async (
  chainId: string | number | bigint,
  gameAddress: string,
  characterId: string | number | bigint,
): Promise<null | CharacterMetaDB> => {
  try {
    const client = await dbPromise;
    const result = await client.collection('characters').findOne({
      gameAddress: getAddress(gameAddress),
      characterId: BigInt(characterId).toString(),
      chainId: BigInt(chainId).toString(),
    });
    return result ? (result as CharacterMetaDB) : null;
  } catch (error) {
    console.error('Error in getCharacterMetaFromDB: ', error);
    return null;
  }
};

export const updateCharacterInDB = async (
  update: Partial<CharacterMetaDB>,
): Promise<null | CharacterMetaDB> => {
  try {
    if (!(update.gameAddress && update.characterId)) return null;

    const client = await dbPromise;
    const result = await client.collection('characters').findOneAndUpdate(
      {
        gameAddress: getAddress(update.gameAddress),
        characterId: BigInt(update.characterId).toString(),
      },
      {
        $set: {
          ...update,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      {
        returnDocument: 'after',
        upsert: true,
      },
    );
    return result ? (result as CharacterMetaDB) : null;
  } catch (error) {
    console.error('Error in updateCharacterInDB: ', error);
    return null;
  }
};
