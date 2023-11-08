import { getAddress } from 'viem';

import { dbPromise } from '@/lib/mongodb';
import { ClaimableTreeDB } from '@/utils/types';

import { isSupportedChain } from './web3';

export const getClaimableTreeFromDB = async (
  gameAddress: string,
  itemId: string | number | bigint,
  chainId: string | number | bigint,
): Promise<null | ClaimableTreeDB> => {
  try {
    if (!isSupportedChain(Number(chainId))) {
      console.error(
        `Error in getClaimableTreeFromDB: chainId not supported: ${chainId}`,
      );
      return null;
    }
    const client = await dbPromise;
    const result = await client.collection('claimableTrees').findOne({
      gameAddress: getAddress(gameAddress),
      itemId: BigInt(itemId).toString(),
      chainId: BigInt(chainId).toString(),
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
  chainId: string | number | bigint,
): Promise<null | ClaimableTreeDB> => {
  try {
    if (!isSupportedChain(Number(chainId))) {
      console.error(
        `Error in updateClaimableTreeInDB: chainId not supported: ${chainId}`,
      );
      return null;
    }
    const client = await dbPromise;
    const result = await client.collection('claimableTrees').findOneAndUpdate(
      {
        gameAddress: getAddress(gameAddress),
        itemId: BigInt(itemId).toString(),
        chainId: BigInt(chainId).toString(),
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
          chainId: BigInt(chainId).toString(),
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
