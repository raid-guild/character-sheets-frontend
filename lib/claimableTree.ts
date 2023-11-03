import { getAddress } from 'viem';

import { dbPromise } from '@/lib/mongodb';
import { ClaimableTreeDB } from '@/utils/types';

import { DEFAULT_CHAIN } from './web3';

export const getClaimableTreeFromDB = async (
  gameAddress: string,
  itemId: string | number | bigint,
): Promise<null | ClaimableTreeDB> => {
  try {
    const client = await dbPromise;
    const result = await client.collection('claimableTrees').findOne({
      gameAddress: getAddress(gameAddress),
      itemId: BigInt(itemId).toString(),
      chainId: DEFAULT_CHAIN.id.toString(),
    });
    return result ? (result as ClaimableTreeDB) : null;
  } catch (error) {
    console.error('Error in getClaimableTreeFromDB: ', error);
    return null;
  }
};

export const updateClaimableTreeInDB = async (
  gameAddress: string,
  itemId: string | number | bigint,
  tree: string,
  updatedBy: `0x${string}`,
): Promise<null | ClaimableTreeDB> => {
  try {
    const client = await dbPromise;
    const result = await client.collection('claimableTrees').findOneAndUpdate(
      {
        gameAddress: getAddress(gameAddress),
        itemId: BigInt(itemId).toString(),
        chainId: DEFAULT_CHAIN.id.toString(),
      },
      {
        $set: {
          tree,
          updatedAt: new Date(),
          updatedBy: getAddress(updatedBy),
        },
        $setOnInsert: {
          gameAddress: getAddress(gameAddress),
          itemId: BigInt(itemId).toString(),
          chainId: DEFAULT_CHAIN.id.toString(),
          createdAt: new Date(),
        },
      },
      {
        upsert: true,
        returnDocument: 'after',
      },
    );

    return result ? (result as ClaimableTreeDB) : null;
  } catch (error) {
    console.error('Error in updateClaimableTreeInDB: ', error);
    return null;
  }
};
