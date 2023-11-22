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
import { uploadToWeb3Storage } from '@/lib/fileStorage';
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
    const { traits } = JSON.parse(req.body) as { traits: CharacterTraits };

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
