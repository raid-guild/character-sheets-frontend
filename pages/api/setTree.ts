import { NextApiRequest, NextApiResponse } from 'next';
import { getAddress, parseAbi } from 'viem';

import { withAuth } from '@/lib/auth';
import { dbPromise } from '@/lib/mongodb';
import { readClient } from '@/lib/web3';

const DUNGEON_MASTER_ROLE =
  '0x9f5957e014b94f6c4458eb946e74e5d7e489dfaff6e0bddd07dd7d48100ca913';

const setTree = async (
  account: `0x${string}`,
  req: NextApiRequest,
  res: NextApiResponse,
) => {
  if (req.method !== 'POST') return res.status(405).end();

  const {
    gameAddress: _gameAddress,
    itemId: _itemId,
    tree,
  } = JSON.parse(req.body);

  let gameAddress: `0x${string}`;
  let itemId: string;

  try {
    gameAddress = getAddress(_gameAddress);
    itemId = BigInt(_itemId).toString();
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: 'Invalid game address or item id' });
  }

  try {
    const isDungeonMaster = await readClient.readContract({
      address: gameAddress,
      abi: parseAbi([
        'function hasRole(bytes32 role, address account) public view returns (bool)',
      ]),
      functionName: 'hasRole',
      args: [DUNGEON_MASTER_ROLE, account],
    });

    if (!isDungeonMaster) {
      return res.status(403).json({ error: 'Not dungeon master' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error });
  }

  try {
    const client = await dbPromise;

    const result = await client.collection('claimableTrees').findOneAndUpdate(
      {
        gameAddress,
        itemId,
      },
      {
        $set: {
          tree,
        },
        $setOnInsert: {
          gameAddress,
          itemId,
        },
      },
      {
        upsert: true,
        returnDocument: 'after',
      },
    );

    if (!result) {
      console.error('Could not set tree');
      return res.status(500).json({ error: 'Could not set tree' });
    }

    return res.status(200).json({ id: result._id });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error });
  }
};

export default withAuth(setTree);
