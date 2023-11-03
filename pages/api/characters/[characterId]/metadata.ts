import { NextApiRequest, NextApiResponse } from 'next';
import { isAddress, isHex } from 'viem';

import { getCharacterMetaFromDB } from '@/lib/character';

export default async function getCharacterMetadata(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') return res.status(405).end();

  const { characterId: extendedCharacterId } = req.query;

  if (typeof extendedCharacterId !== 'string' || !extendedCharacterId) {
    return res.status(400).end();
  }

  const [gameAddress, label, characterIdHex] = extendedCharacterId.split('-');

  if (
    typeof gameAddress !== 'string' ||
    typeof characterIdHex !== 'string' ||
    !gameAddress ||
    !characterIdHex ||
    label !== 'character'
  ) {
    return res.status(400).end();
  }

  if (!isAddress(gameAddress) || !isHex(characterIdHex)) {
    return res.status(400).end();
  }

  try {
    const characterMeta = getCharacterMetaFromDB(gameAddress, characterIdHex);

    if (!characterMeta) {
      console.error(`Character ${extendedCharacterId} not found in DB`);
      return res.status(404).end();
    }

    return res.status(200).json(characterMeta);
  } catch (error) {
    return res.status(500).json({ error });
  }
}
