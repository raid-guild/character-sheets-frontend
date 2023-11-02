import { NextApiRequest, NextApiResponse } from 'next';
import { getAddress } from 'viem';

import { dbPromise } from '@/lib/mongodb';

export const setCharacterMetadata = async (
  req: NextApiRequest,
  res: NextApiResponse,
) => {
  if (req.method !== 'POST') return res.status(405).end();

  const { characterId: unvalidatedCharacterId, metaData } = JSON.parse(
    req.body,
  );

  const [_gameAddress, , _characterId] = unvalidatedCharacterId.split('-');

  let gameAddress: `0x${string}`;
  let characterId: string;

  try {
    gameAddress = getAddress(_gameAddress);
    characterId = BigInt(_characterId).toString();
  } catch (error) {
    console.error(error);
    return res
      .status(400)
      .json({ error: 'Invalid game address or character id' });
  }

  const formattedCharacterId = `${gameAddress}-character-${characterId}`;

  try {
    const client = await dbPromise;

    const result = await client
      .collection('characterMetadata')
      .findOneAndUpdate(
        {
          formattedCharacterId,
        },
        {
          $set: {
            metaData,
          },
          $setOnInsert: {
            formattedCharacterId,
          },
        },
        {
          upsert: true,
          returnDocument: 'after',
        },
      );

    if (!result) {
      console.error('Could not set metadata');
      return res.status(500).json({ error: 'Could not set metadata' });
    }

    return res.status(200).json({ id: result._id });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error });
  }
};
