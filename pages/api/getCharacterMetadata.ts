import { NextApiRequest, NextApiResponse } from 'next';

import { getCharacterMetadata as getCharacterMetadataLib } from '@/lib/characterMetadata';

export default async function getCharacterMetadata(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') return res.status(405).end();

  const { characterId } = req.query;

  if (typeof characterId !== 'string' || !characterId) {
    return res.status(400).end();
  }

  try {
    const metadata = await getCharacterMetadataLib(characterId);

    return res.status(200).json({ metadata });
  } catch (error) {
    return res.status(500).json({ error });
  }
}
