import Jimp from 'jimp';
import type { NextApiRequest, NextApiResponse } from 'next';
import { File } from 'web3.storage';

import {
  BaseTraitType,
  CharacterTraits,
  EquippableTraitType,
  getAttributesFromTraitsObject,
  getImageUrl,
  traitPositionToIndex,
  TraitsArray,
} from '@/components/JoinGame/traits';
import {
  CharacterInfoFragment,
  GetCharacterInfoByIdDocument,
} from '@/graphql/autogen/types';
import { getGraphClient } from '@/graphql/client';
import { uploadToWeb3Storage } from '@/lib/fileStorage';
import { formatItem } from '@/utils/helpers';
import { Attribute, Item } from '@/utils/types';

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

      const character = data?.character as CharacterInfoFragment | null;
      if (!character)
        return res.status(404).json({ error: 'Character not found' });

      const equippedItems = await Promise.all(
        character.equippedItems.map(h => formatItem(h.item)),
      );

      const equippedItem1s = equippedItems.filter(
        i =>
          i.attributes &&
          i.attributes[0].value === EquippableTraitType.EQUIPPED_ITEM_1,
      );
      const equippedWearables = equippedItems.filter(
        i =>
          i.attributes &&
          i.attributes[0].value === EquippableTraitType.EQUIPPED_WEARABLE,
      );

      const equippedItem2s = equippedItems.filter(
        i =>
          i.attributes &&
          i.attributes[0].value === EquippableTraitType.EQUIPPED_ITEM_2,
      );

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

const getEquippableTraitName = (
  equippableTraitType: EquippableTraitType,
  items: Item[],
  traits: CharacterTraits,
): CharacterTraits => {
  if (
    items[0]?.equippable_layer &&
    !traits[equippableTraitType].includes('equippable')
  ) {
    if (traits[equippableTraitType].includes('remove')) {
      traits[equippableTraitType] = items[1]
        ? `equippable_${items[1].name}_${items[1].equippable_layer}`
        : '';
    } else {
      traits[
        equippableTraitType
      ] = `equippable_${items[0].name}_${items[0].equippable_layer}`;
    }
  }

  return traits;
};
