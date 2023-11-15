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

const verifyCharacterPlayer = async (
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
    return false;
  }

  const characterMeta = data?.character as CharacterMetaInfoFragment | null;

  if (!characterMeta) {
    console.error('character meta not found');
    return false;
  }

  const isCharacterPlayer =
    characterMeta.player.toLowerCase() === account.address.toLowerCase();

  return isCharacterPlayer;
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
    const isCharacterPlayer = await verifyCharacterPlayer(
      extendedCharacterId,
      account,
    );
    if (!isCharacterPlayer) {
      return res
        .status(403)
        .json({ error: 'Not authorized to update character metadata' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error });
  }

  try {
    const update: Partial<CharacterMetaDB> = {
      gameAddress: getAddress(gameAddress),
      characterId: BigInt(characterId).toString(),
      uri: `${BASE_CHARACTER_URI}${chainLabel}/${extendedCharacterId}`,
      name,
      description,
      image,
      attributes,
    };

    const characterMeta = await updateCharacterInDB(update);

    if (!characterMeta) {
      return res
        .status(500)
        .json({ error: 'Error updating character metadata' });
    }

    return res.status(200).json(characterMeta);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error });
  }
};

export default withAuth(updateCharacterMetadata);
