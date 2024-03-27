import { NextApiRequest, NextApiResponse } from 'next';

import { isSupportedChain } from '@/lib/web3';
import { getWhitelistTreeFromDB } from '@/lib/whitelistTree';

export default async function getTree(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') return res.status(405).end();

  const { gameAddress, itemId, chainId } = req.query;

  if (
    typeof gameAddress !== 'string' ||
    typeof itemId !== 'string' ||
    typeof chainId !== 'string' ||
    !gameAddress ||
    !itemId ||
    !chainId
  ) {
    return res.status(400).end();
  }

  if (!isSupportedChain(chainId)) {
    return res.status(400).json({ error: 'Invalid chain id' });
  }

  try {
    const tree = await getWhitelistTreeFromDB(gameAddress, itemId, chainId);

    if (!tree) {
      return res.status(404).end();
    }

    return res.status(200).json(tree);
  } catch (error) {
    return res.status(500).json({ error });
  }
}
