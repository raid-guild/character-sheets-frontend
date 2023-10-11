import { NextApiRequest, NextApiResponse } from 'next';

import { dbPromise } from '@/lib/mongodb';

export default async function setTree(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') return res.status(405).end();

  const { gameAddress, itemId, tree } = JSON.parse(req.body);
  const client = await dbPromise;

  try {
    const result = await client
      .collection('claimableTrees')
      .insertOne({ gameAddress, itemId, tree });
    return res.status(200).json({ id: result.insertedId });
  } catch (error) {
    return res.status(500).json({ error });
  }
}
