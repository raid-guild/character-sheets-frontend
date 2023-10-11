import { dbPromise } from '@/lib/mongodb';

export const getClaimableTree = async (
  gameAddress: string,
  itemId: number,
): Promise<null | string> => {
  try {
    const client = await dbPromise;
    const result = await client
      .collection('claimableTrees')
      .findOne({ gameAddress, itemId });
    return result?.tree ?? null;
  } catch (error) {
    console.error(error);
    return null;
  }
};
