import { NextApiRequest, NextApiResponse } from 'next';
import { getAddress } from 'viem';

import {
  FullGameInfoFragment,
  GetGameWithMastersDocument,
} from '@/graphql/autogen/types';
import { client } from '@/graphql/client';
import { withAuth } from '@/lib/auth';
import { updateClaimableTreeInDB } from '@/lib/claimableTree';

const verifyGameMaster = async (
  gameAddress: `0x${string}`,
  account: `0x${string}`,
) => {
  const { data, error } = await client.query(GetGameWithMastersDocument, {
    gameId: gameAddress.toLowerCase(),
  });

  if (error) {
    console.error('Error getting game masters', error);
    return false;
  }

  const game = data?.game as Pick<FullGameInfoFragment, 'masters'> | null;

  if (!game) {
    console.error('Game not found');
    return false;
  }

  const isGameMaster = game.masters.some(
    master => master.address.toLowerCase() === account.toLowerCase(),
  );

  return isGameMaster;
};

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
    const isGameMaster = await verifyGameMaster(gameAddress, account);
    if (!isGameMaster) {
      return res.status(403).json({ error: 'Not dungeon master' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error });
  }

  try {
    const result = await updateClaimableTreeInDB(
      gameAddress,
      itemId,
      tree,
      account,
    );

    if (!result) {
      console.error('Could not set tree');
      return res.status(500).json({ error: 'Could not set tree' });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error });
  }
};

export default withAuth(setTree);
