import { NextApiRequest, NextApiResponse } from 'next';
import { getAddress, isAddress, isHex } from 'viem';

import {
  CharacterMetaInfoFragment,
  GetCharacterMetaDocument,
} from '@/graphql/autogen/types';
import { client } from '@/graphql/client';
import { updateCharacterInDB } from '@/lib/character';
import { uriToHttp } from '@/utils/helpers';
import { CharacterMetaDB } from '@/utils/types';

const getCharacterMetaFromTheGraph = async (
  characterId: string,
): Promise<CharacterMetaInfoFragment | null> => {
  const { data, error } = await client.query(GetCharacterMetaDocument, {
    characterId: characterId.toLowerCase(),
  });

  if (error) {
    throw new Error('Error getting character meta: ' + error);
  }

  const characterMeta = data?.character as CharacterMetaInfoFragment | null;

  if (!characterMeta) {
    return null;
  }

  return characterMeta;
};

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
    const character = await getCharacterMetaFromTheGraph(characterIdHex);

    if (!character) {
      return res.status(404).end();
    }

    const { uri } = character;

    if (!uri) {
      throw new Error('Character has no URI');
    }

    let update: Partial<CharacterMetaDB> = {
      gameAddress: getAddress(gameAddress),
      characterId: characterIdHex,
      uri: uri,
      player: character.player,
      account: character.account,
    };

    if (uri.startsWith('ipfs://')) {
      const response = await fetch(uriToHttp(uri)[0]);
      const data = await response.json();
      update = {
        ...update,
        name: data.name,
        description: data.description,
        image: data.image,
      };
    }

    const characterMeta = await updateCharacterInDB(
      gameAddress,
      characterIdHex,
      update,
    );

    if (!characterMeta) {
      throw new Error('Error updating character');
    }

    return res.status(200).json(characterMeta);
  } catch (error) {
    return res.status(500).json({ error });
  }
}
