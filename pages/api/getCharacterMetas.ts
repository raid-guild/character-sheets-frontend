import { NextApiRequest, NextApiResponse } from 'next';

import { FullGameInfoFragment, GetGameDocument } from '@/graphql/autogen/types';
import { getGraphClient } from '@/graphql/client';
import { getCharacterMetasFromDBWithURIs } from '@/lib/character';
import { isSupportedChain } from '@/lib/web3';

export default async function getCharacterMetas(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') return res.status(405).end();

  const { chainId: chainIdString, gameAddress } = req.query;
  const chainId = Number(chainIdString);

  if (!isSupportedChain(chainId)) {
    return res.status(400).json({ error: 'Invalid chain id' });
  }

  if (typeof gameAddress !== 'string' || !gameAddress || !chainId) {
    return res.status(400).end();
  }

  try {
    const client = getGraphClient(chainId);
    const { data, error } = await client.query(GetGameDocument, {
      gameId: gameAddress.toLowerCase(),
    });

    if (error) {
      throw new Error('Error getting character meta: ' + error);
    }

    const game = data?.game as FullGameInfoFragment | null;

    if (!game) {
      return res.status(404).end();
    }

    const characterURIs = game.characters.map(c => c.uri);
    const characterDBMetadatas =
      await getCharacterMetasFromDBWithURIs(characterURIs);

    if (!characterDBMetadatas) {
      return res.status(404).end();
    }

    return res.status(200).json(characterDBMetadatas);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error });
  }
}
