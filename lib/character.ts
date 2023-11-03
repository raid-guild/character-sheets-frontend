import { getAddress } from 'viem';

import { dbPromise } from '@/lib/mongodb';
import { CharacterMetaDB } from '@/utils/types';

import { DEFAULT_CHAIN } from './web3';

export const getCharacterMetaFromDB = async (
  gameAddress: string,
  characterId: string | number | bigint,
): Promise<null | CharacterMetaDB> => {
  try {
    const client = await dbPromise;
    const result = await client.collection('characters').findOne({
      gameAddress: getAddress(gameAddress),
      characterId: BigInt(characterId).toString(),
      chainId: DEFAULT_CHAIN.id,
    });
    return result ? (result as CharacterMetaDB) : null;
  } catch (error) {
    console.error('Error in getCharacterMetaFromDB: ', error);
    return null;
  }
};

export const updateCharacterInDB = async (
  gameAddress: string,
  characterId: string | number | bigint,
  update: Partial<CharacterMetaDB>,
): Promise<null | CharacterMetaDB> => {
  try {
    const client = await dbPromise;
    const result = await client.collection('characters').findOneAndUpdate(
      {
        gameAddress: getAddress(gameAddress),
        characterId: BigInt(characterId).toString(),
      },
      {
        $set: {
          ...update,
          gameAddress: getAddress(gameAddress),
          characterId: BigInt(characterId).toString(),
          updatedAt: new Date(),
        },
        $setOnInsert: {
          ...update,
          gameAddress: getAddress(gameAddress),
          characterId: BigInt(characterId).toString(),
          chainId: DEFAULT_CHAIN.id,
          createdAt: new Date(),
          updatedAt: new Date(),
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
