import { NextApiRequest, NextApiResponse } from 'next';

import { WhitelistItemLeaf } from '@/hooks/useWhitelistTree';
import { isSupportedChain } from '@/lib/web3';
import { getAllWhitelistTreesFromDB } from '@/lib/whitelistTree';

export default async function getWhitelistedTreeLeaves(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') return res.status(405).end();

  const { gameAddress, character, chainId } = req.query;

  if (
    typeof gameAddress !== 'string' ||
    typeof chainId !== 'string' ||
    typeof character !== 'string' ||
    !gameAddress ||
    !character ||
    !chainId
  ) {
    return res.status(400).end();
  }

  if (!isSupportedChain(chainId)) {
    return res.status(400).json({ error: 'Invalid chain id' });
  }

  try {
    const trees = await getAllWhitelistTreesFromDB(gameAddress, chainId);

    const leaves = trees
      .map(({ tree }) => {
        const parsed = JSON.parse(tree);
        const values = parsed.values.map((v: unknown) => {
          return (v as { value: WhitelistItemLeaf }).value;
        });
        return values;
      })
      .flat();

    const whitelistedLeaves = leaves.filter(leaf => {
      return leaf[1].toLowerCase() === character.toLowerCase();
    });

    return res.status(200).json(whitelistedLeaves);
  } catch (error) {
    return res.status(500).json({ error });
  }
}
