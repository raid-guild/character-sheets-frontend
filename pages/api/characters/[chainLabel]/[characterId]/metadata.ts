import { NextApiRequest, NextApiResponse } from 'next';
import { isAddress, isHex } from 'viem';

import { getCharacterMetaFromDB } from '@/lib/character';
import { getChainIdFromLabel } from '@/lib/web3';

export default async function getCharacterMetadata(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') return res.status(405).end();

  const { chainLabel, characterId: extendedCharacterId } = req.query;
  const chainId = getChainIdFromLabel(chainLabel as string);

  if (
    typeof extendedCharacterId !== 'string' ||
    !extendedCharacterId ||
    typeof chainId !== 'number' ||
    !chainId
  ) {
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
    const characterMeta = await getCharacterMetaFromDB(
      chainId,
      gameAddress,
      characterIdHex,
    );

    if (!characterMeta) {
      console.error(`Character ${extendedCharacterId} not found in DB`);
      return res.status(404).end();
    }

    return res.status(200).json(characterMeta);
  } catch (error) {
    return res.status(500).json({ error });
  }
}
