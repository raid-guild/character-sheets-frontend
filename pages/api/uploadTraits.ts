import Jimp from 'jimp';
import type { NextApiRequest, NextApiResponse } from 'next';
import { File } from 'web3.storage';

import {
  CharacterInfoFragment,
  GetCharacterInfoByIdDocument,
} from '@/graphql/autogen/types';
import { getGraphClient } from '@/graphql/client';
import { uploadToWeb3Storage } from '@/lib/fileStorage';
import {
  BaseTraitType,
  CharacterTraits,
  EquippableTraitType,
  getAttributesFromTraitsObject,
  getEquippableTraitName,
  getImageUrl,
  traitPositionToIndex,
  TraitsArray,
} from '@/lib/traits';
import { formatCharacter, formatItem } from '@/utils/helpers';
import { Attribute } from '@/utils/types';

type ResponseData = {
  attributes?: Attribute[];
  cid?: string;
  error?: string;
};

export default async function uploadTraits(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const {
      chainId: chainIdString,
      characterId: extendedCharacterId,
      traits: _traits,
    } = JSON.parse(req.body) as {
      chainId?: string;
      characterId?: string;
      traits: CharacterTraits;
    };

    if (!_traits) return res.status(400).json({ error: 'No traits provided' });

    let traits = _traits;

    if (extendedCharacterId && chainIdString) {
      const chainId = Number(chainIdString);
      const { data, error } = await getGraphClient(chainId).query(
        GetCharacterInfoByIdDocument,
        {
          characterId: extendedCharacterId.toLowerCase(),
        },
      );

      if (error) {
        console.error('Error getting character', error);
        return res.status(500).json({ error: 'Something went wrong' });
      }

      const unformattedCharacter =
        data?.character as CharacterInfoFragment | null;
      if (!unformattedCharacter)
        return res.status(404).json({ error: 'Character not found' });

      const items = await Promise.all(
        unformattedCharacter.equippedItems.map(equippedItem =>
          formatItem(equippedItem.item),
        ),
      );

      const character = await formatCharacter(unformattedCharacter, [], items);

      const equippedItem1s = character.equippedItems
        .filter(
          i =>
            i.attributes &&
            i.attributes[0]?.value === EquippableTraitType.EQUIPPED_ITEM_1,
        )
        .sort((a, b) => {
          if (!a.equippedAt || !b.equippedAt) return 0;
          return b.equippedAt - a.equippedAt;
        });

      const equippedWearables = character.equippedItems
        .filter(
          i =>
            i.attributes &&
            i.attributes[0]?.value === EquippableTraitType.EQUIPPED_WEARABLE,
        )
        .sort((a, b) => {
          if (!a.equippedAt || !b.equippedAt) return 0;
          return b.equippedAt - a.equippedAt;
        });

      const equippedItem2s = character.equippedItems
        .filter(
          i =>
            i.attributes &&
            i.attributes[0]?.value === EquippableTraitType.EQUIPPED_ITEM_2,
        )
        .sort((a, b) => {
          if (!a.equippedAt || !b.equippedAt) return 0;
          return b.equippedAt - a.equippedAt;
        });

      traits = getEquippableTraitName(
        EquippableTraitType.EQUIPPED_ITEM_1,
        equippedItem1s,
        traits,
      );

      traits = getEquippableTraitName(
        EquippableTraitType.EQUIPPED_WEARABLE,
        equippedWearables,
        traits,
      );

      traits = getEquippableTraitName(
        EquippableTraitType.EQUIPPED_ITEM_2,
        equippedItem2s,
        traits,
      );
    }

    const traitsArray: TraitsArray = ['', '', '', '', '', '', '', ''];
    Object.keys(traits).forEach(traitType => {
      const trait = traits[traitType as keyof CharacterTraits];
      const index = traitPositionToIndex(traitType as keyof CharacterTraits);

      if (
        traitType === BaseTraitType.CLOTHING &&
        !!traits[EquippableTraitType.EQUIPPED_WEARABLE]
      ) {
        return;
      }

      if (!trait) return;
      traitsArray[index] = trait;
    });

    const filteredTraitsArray = traitsArray.filter(trait => trait !== '');

    const traitImages = await Promise.all(
      filteredTraitsArray.map(async trait => {
        const url = getImageUrl(trait);
        const image = await Jimp.read(url);
        return image;
      }),
    );

    const imageComposite = traitImages.reduce((acc, image) => {
      return acc.composite(image, 0, 0);
    });

    const fileContents = await imageComposite.getBufferAsync(Jimp.MIME_PNG);

    const file = new File([fileContents], 'characterAvater.png');

    const attributes = getAttributesFromTraitsObject(traits);
    const cid = await uploadToWeb3Storage(file);

    return res.status(200).json({ attributes, cid });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
