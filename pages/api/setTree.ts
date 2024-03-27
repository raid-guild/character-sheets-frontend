import { NextApiRequest, NextApiResponse } from 'next';
import { getAddress } from 'viem';

import {
  FullGameInfoFragment,
  GetGameWithMastersDocument,
} from '@/graphql/autogen/types';
import { getGraphClient } from '@/graphql/client';
import { AccountInfo, withAuth } from '@/lib/auth';
import { isSupportedChain } from '@/lib/web3';
import { updateWhitelistTreeInDB } from '@/lib/whitelistTree';

const verifyGameMaster = async (
  gameAddress: `0x${string}`,
  account: AccountInfo,
) => {
  const { data, error } = await getGraphClient(account.chainId).query(
    GetGameWithMastersDocument,
    {
      gameId: gameAddress.toLowerCase(),
    },
  );

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
    master => master.address.toLowerCase() === account.address.toLowerCase(),
  );

  return isGameMaster;
};

const setTree = async (
  account: AccountInfo,
  req: NextApiRequest,
  res: NextApiResponse,
) => {
  if (req.method !== 'POST') return res.status(405).end();

  const {
    gameAddress: _gameAddress,
    itemId: _itemId,
    chainId,
    tree,
  } = JSON.parse(req.body);

  let gameAddress: `0x${string}`;
  let itemId: string;

  if (!isSupportedChain(chainId) || account.chainId !== chainId) {
    return res.status(400).json({ error: 'Invalid chain id' });
  }

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
    const result = await updateWhitelistTreeInDB(
      gameAddress,
      itemId,
      tree,
      account.address,
      chainId,
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
