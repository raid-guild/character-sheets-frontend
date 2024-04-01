import { getAddress } from 'viem';

import { dbPromise } from '@/lib/mongodb';
import { WhitelistTreeDB } from '@/utils/types';

import { isSupportedChain } from './web3';

export const getAllWhitelistTreesFromDB = async (
  gameAddress: string,
  chainId: string | number | bigint,
): Promise<Array<WhitelistTreeDB>> => {
  try {
    if (!isSupportedChain(Number(chainId))) {
      console.error(
        `Error in getAllWhitelistTreesFromDB: chainId not supported: ${chainId}`,
      );
      return [];
    }
    const client = await dbPromise;
    const result = await client
      .collection('whitelistTrees')
      .find({
        gameAddress: getAddress(gameAddress),
        chainId: BigInt(chainId).toString(),
      })
      .toArray();
    return result ? (result as Array<WhitelistTreeDB>) : [];
  } catch (error) {
    console.error('Error in getAllWhitelistTreesFromDB: ', error);
    return [];
  }
};

export const getWhitelistTreeFromDB = async (
  gameAddress: string,
  itemId: string | number | bigint,
  chainId: string | number | bigint,
): Promise<null | WhitelistTreeDB> => {
  try {
    if (!isSupportedChain(Number(chainId))) {
      console.error(
        `Error in getWhitelistTreeFromDB: chainId not supported: ${chainId}`,
      );
      return null;
    }
    const client = await dbPromise;
    const result = await client.collection('whitelistTrees').findOne({
      gameAddress: getAddress(gameAddress),
      itemId: BigInt(itemId).toString(),
      chainId: BigInt(chainId).toString(),
    });
    return result ? (result as WhitelistTreeDB) : null;
  } catch (error) {
    console.error('Error in getWhitelistTreeFromDB: ', error);
    return null;
  }
};

export const updateWhitelistTreeInDB = async (
  gameAddress: string,
  itemId: string | number | bigint,
  tree: string,
  updatedBy: `0x${string}`,
  chainId: string | number | bigint,
): Promise<null | WhitelistTreeDB> => {
  try {
    if (!isSupportedChain(Number(chainId))) {
      console.error(
        `Error in updateWhitelistTreeInDB: chainId not supported: ${chainId}`,
      );
      return null;
    }
    const client = await dbPromise;
    const result = await client.collection('whitelistTrees').findOneAndUpdate(
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

    return result ? (result as WhitelistTreeDB) : null;
  } catch (error) {
    console.error('Error in updateWhitelistTreeInDB: ', error);
    return null;
  }
};
