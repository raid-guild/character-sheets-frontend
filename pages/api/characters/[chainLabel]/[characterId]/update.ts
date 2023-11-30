import { NextApiRequest, NextApiResponse } from 'next';
import { getAddress } from 'viem';

import {
  CharacterMetaInfoFragment,
  GetCharacterMetaByIdDocument,
} from '@/graphql/autogen/types';
import { getGraphClient } from '@/graphql/client';
import { AccountInfo, withAuth } from '@/lib/auth';
import { updateCharacterInDB } from '@/lib/character';
import { BASE_CHARACTER_URI } from '@/utils/constants';
import { CharacterMetaDB } from '@/utils/types';

const getCharacterMetaFromGraph = async (
  extendedCharacterId: string,
  account: AccountInfo,
) => {
  const { data, error } = await getGraphClient(account.chainId).query(
    GetCharacterMetaByIdDocument,
    {
      characterId: extendedCharacterId.toLowerCase(),
    },
  );

  if (error) {
    console.error('Error getting character', error);
    return JSON.stringify(error);
  }

  return data?.character as CharacterMetaInfoFragment | null;
};

const updateCharacterMetadata = async (
  account: AccountInfo,
  req: NextApiRequest,
  res: NextApiResponse,
) => {
  if (req.method !== 'POST') return res.status(405).end();

  const { chainLabel, characterId: extendedCharacterId } = req.query;

  const { name, description, image, attributes } = JSON.parse(req.body);

  if (
    typeof extendedCharacterId !== 'string' ||
    !extendedCharacterId ||
    typeof name !== 'string' ||
    !name ||
    typeof description !== 'string' ||
    !description ||
    typeof image !== 'string' ||
    !image ||
    !Array.isArray(attributes)
  ) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const [_gameAddress, label, _characterId] = extendedCharacterId.split('-');

  if (
    typeof _gameAddress !== 'string' ||
    typeof _characterId !== 'string' ||
    !_gameAddress ||
    !_characterId ||
    label !== 'character'
  ) {
    return res.status(400).end();
  }

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

  try {
    const characterMeta = await getCharacterMetaFromGraph(
      extendedCharacterId,
      account,
    );

    if (typeof characterMeta === 'string') {
      return res.status(500).json({ error: characterMeta });
    }

    const isCharacterPlayer =
      characterMeta?.player.toLowerCase() === account.address.toLowerCase();
    if (!!characterMeta && !isCharacterPlayer) {
      return res
        .status(403)
        .json({ error: 'Not authorized to update character metadata' });
    }

    const update: Partial<CharacterMetaDB> = {
      chainId: BigInt(account.chainId).toString(),
      gameAddress: getAddress(gameAddress),
      characterId: BigInt(characterId).toString(),
      uri: `${BASE_CHARACTER_URI}${chainLabel}/${extendedCharacterId}`,
      player: characterMeta?.player ?? account.address,
      account: characterMeta?.account ?? '',
      name,
      description,
      image,
      attributes,
    };

    const dbCharacterMeta = await updateCharacterInDB(update);

    if (!dbCharacterMeta) {
      return res
        .status(500)
        .json({ error: 'Error updating character metadata' });
    }

    return res.status(200).json(dbCharacterMeta);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error });
  }
};

export default withAuth(updateCharacterMetadata);
