import { NextApiRequest, NextApiResponse } from 'next';
import { getAddress, isAddress, isHex } from 'viem';

import {
  CharacterMetaInfoFragment,
  GetCharacterMetaByIdDocument,
  GetCharacterMetaByUriDocument,
} from '@/graphql/autogen/types';
import { getGraphClient } from '@/graphql/client';
import {
  getCharacterMetaFromDBWithId,
  getCharacterMetaFromDBWithURI,
  updateCharacterInDB,
} from '@/lib/character';
import { getChainIdFromLabel } from '@/lib/web3';
import { BASE_CHARACTER_URI } from '@/utils/constants';
import { uriToHttp } from '@/utils/helpers';
import { CharacterMetaDB } from '@/utils/types';

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

  const isCID = extendedCharacterId.match(/^[a-zA-Z0-9]{46,59}$/);

  if (isCID) {
    const dbCharacterMeta = await getMetadataFromDBWithCID(extendedCharacterId);
    if (!dbCharacterMeta) {
      // eslint-disable-next-line no-console
      console.log(
        'URI',
        `${BASE_CHARACTER_URI}${chainLabel}/${extendedCharacterId}`,
      );
      const result = await updateDBMetadataWithGraphViaURI(
        chainId,
        `${BASE_CHARACTER_URI}${chainLabel}/${extendedCharacterId}`,
      );

      if (result === null) {
        return res.status(404).end();
      } else if (typeof result === 'string') {
        return res.status(500).json({ error: result });
      }
      return res.status(200).json(result);
    }
    return res.status(200).json(dbCharacterMeta);
  } else {
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

    const dbCharacterMeta = await getCharacterMetaFromDBWithId(
      chainId,
      gameAddress,
      characterIdHex,
    );

    if (!dbCharacterMeta) {
      const result = await updateDBMetadataWithGraphViaId(
        chainId,
        gameAddress,
        characterIdHex,
        extendedCharacterId,
      );

      if (result === null) {
        return res.status(404).end();
      } else if (typeof result === 'string') {
        return res.status(500).json({ error: result });
      }
      return res.status(200).json(result);
    }
    return res.status(200).json(dbCharacterMeta);
  }
}

/**
 * DATABASE GETTER HELPERS
 */

const getMetadataFromDBWithCID = async (
  cid: string,
): Promise<CharacterMetaDB | null> => {
  try {
    const uri = `ipfs://${cid}`;
    const characterMeta = await getCharacterMetaFromDBWithURI(uri);

    if (!characterMeta) {
      console.error(`Character URI ipfs://${cid} not found in DB`);
      return null;
    }

    return characterMeta;
  } catch (error) {
    console.error(error);
    return null;
  }
};

/**
 * THE GRAPH GETTER HELPERS
 */

const getCharacterMetaFromTheGraphWithId = async (
  chainId: number,
  characterId: string,
): Promise<CharacterMetaInfoFragment | null> => {
  const client = getGraphClient(chainId);
  const { data, error } = await client.query(GetCharacterMetaByIdDocument, {
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

const getCharacterMetaFromTheGraphWithURI = async (
  chainId: number,
  uri: string,
): Promise<CharacterMetaInfoFragment | null> => {
  const client = getGraphClient(chainId);
  const { data, error } = await client.query(GetCharacterMetaByUriDocument, {
    characterURI: uri,
  });

  if (error) {
    throw new Error('Error getting character meta: ' + error);
  }

  const characterMeta = data?.characters[0] as CharacterMetaInfoFragment | null;

  if (!characterMeta) {
    return null;
  }

  return characterMeta;
};

/**
 * DATABASE UPDATER HELPERS
 */

const updateDBMetadataWithGraphViaId = async (
  chainId: number,
  gameAddress: string,
  characterIdHex: string,
  extendedCharacterId: string,
): Promise<CharacterMetaDB | null | string> => {
  try {
    const character = await getCharacterMetaFromTheGraphWithId(
      chainId,
      extendedCharacterId,
    );

    if (!character) {
      return null;
    }

    const { uri } = character;

    if (!uri) {
      throw new Error('Character has no URI');
    }

    let update: Partial<CharacterMetaDB> = {
      chainId: BigInt(chainId).toString(),
      gameAddress: getAddress(gameAddress),
      characterId: BigInt(characterIdHex).toString(),
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
        attributes: data.attributes,
      };
    }

    const characterMeta = await updateCharacterInDB(update);

    if (!characterMeta) {
      throw new Error('Error updating character');
    }

    return characterMeta;
  } catch (error) {
    return JSON.stringify(error);
  }
};

const updateDBMetadataWithGraphViaURI = async (
  chainId: number,
  uri: string,
): Promise<CharacterMetaDB | null | string> => {
  try {
    const character = await getCharacterMetaFromTheGraphWithURI(chainId, uri);

    if (!character) {
      return null;
    }

    const {
      characterId,
      game: { id: gameAddress },
      uri: graphURI,
    } = character;

    if (!graphURI) {
      throw new Error('Character has no URI');
    }

    let update: Partial<CharacterMetaDB> = {
      chainId: BigInt(chainId).toString(),
      gameAddress: getAddress(gameAddress),
      characterId: BigInt(characterId).toString(),
      uri: graphURI,
      player: character.player,
      account: character.account,
    };

    if (graphURI.startsWith('ipfs://')) {
      const response = await fetch(uriToHttp(graphURI)[0]);
      const data = await response.json();
      update = {
        ...update,
        name: data.name,
        description: data.description,
        image: data.image,
        attributes: data.attributes,
      };
    }

    const characterMeta = await updateCharacterInDB(update);

    if (!characterMeta) {
      throw new Error('Error updating character');
    }

    return characterMeta;
  } catch (error) {
    return JSON.stringify(error);
  }
};
