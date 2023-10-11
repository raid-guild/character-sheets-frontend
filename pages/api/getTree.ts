import { NextApiRequest, NextApiResponse } from 'next';

import { getClaimableTree } from '@/lib/claimableTree';

export default async function getTree(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') return res.status(405).end();

  const { gameAddress, itemId } = req.query;

  if (
    typeof gameAddress !== 'string' ||
    typeof itemId !== 'string' ||
    !gameAddress ||
    !itemId
  ) {
    return res.status(400).end();
  }

  try {
    const tree = await getClaimableTree(gameAddress, Number(itemId));

    if (!tree) {
      return res.status(404).end();
    }

    return res.status(200).json({ tree });
  } catch (error) {
    return res.status(500).json({ error });
  }
}
