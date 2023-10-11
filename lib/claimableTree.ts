import { getAddress } from 'viem';

import { dbPromise } from '@/lib/mongodb';

export const getClaimableTree = async (
  gameAddress: string,
  itemId: number,
): Promise<null | string> => {
  try {
    const client = await dbPromise;
    const result = await client.collection('claimableTrees').findOne({
      gameAddress: getAddress(gameAddress),
      itemId: BigInt(itemId).toString(),
    });
    return result?.tree ?? null;
  } catch (error) {
    console.error(error);
    return null;
  }
};
