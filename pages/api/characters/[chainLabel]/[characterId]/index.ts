import Cors from 'cors';
import { NextApiRequest, NextApiResponse } from 'next';
import { getAddress, isAddress, isHex } from 'viem';

import {
  CharacterMetaInfoFragment,
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
import { fetchMetadata } from '@/utils/helpers';
import { CharacterMetaDB } from '@/utils/types';

const cors = Cors({
  methods: ['GET'],
});

function runMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: any,
) {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fn(req, res, (result: any) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

export default async function getCharacterMetadata(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await runMiddleware(req, res, cors);
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
  const uri = `${BASE_CHARACTER_URI}${chainLabel}/${extendedCharacterId}`;

  if (isCID) {
    const dbCharacterMeta = await getCharacterMetaFromDBWithURI(uri);

    if (!dbCharacterMeta) {
      const result = await updateDBMetadata(chainId, uri);

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
      return res.status(404).end();
    }

    if (!(dbCharacterMeta.account && dbCharacterMeta.player)) {
      const result = await updateDBMetadata(chainId, uri);

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

const updateDBMetadata = async (
  chainId: number,
  uri: string,
): Promise<CharacterMetaDB | null | string> => {
  try {
    const character = await getCharacterMetaFromTheGraph(chainId, uri);

    if (!character) {
      return null;
    }

    const {
      account,
      characterId,
      game: { id: gameAddress },
      player,
      uri: graphURI,
    } = character;

    if (!graphURI) {
      throw new Error('Character has no URI');
    }

    const extendedCharacterId = graphURI.split('/').pop();
    const isCID = extendedCharacterId?.match(/^[a-zA-Z0-9]{46,59}$/);

    let characterMeta = null;

    if (isCID && extendedCharacterId) {
      const cid = extendedCharacterId;
      const data = await fetchMetadata(`ipfs://${cid}`);

      const update: Partial<CharacterMetaDB> = {
        chainId: BigInt(chainId).toString(),
        gameAddress: getAddress(gameAddress),
        characterId: BigInt(characterId).toString(),
        uri: graphURI,
        player,
        account,
        name: data.name,
        description: data.description,
        image: data.image,
        attributes: data.attributes,
      };
      characterMeta = await updateCharacterInDB(update);
    } else if (extendedCharacterId) {
      const update: Partial<CharacterMetaDB> = {
        chainId: BigInt(chainId).toString(),
        gameAddress: getAddress(gameAddress),
        characterId: BigInt(characterId).toString(),
        uri: graphURI,
        player,
        account,
      };
      characterMeta = await updateCharacterInDB(update);
    }

    if (!characterMeta) {
      throw new Error('Error updating character');
    }

    return characterMeta;
  } catch (error) {
    return JSON.stringify(error);
  }
};

const getCharacterMetaFromTheGraph = async (
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
