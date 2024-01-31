import Jimp from 'jimp';
import type { NextApiRequest, NextApiResponse } from 'next';

import { uploadToPinata } from '@/lib/fileStorage';
import {
  CharacterTraits,
  getAttributesFromTraitsObject,
  getImageUrl,
} from '@/lib/traits';
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
    const { traitsArray, traitsObject } = JSON.parse(req.body) as {
      traitsArray: string[];
      traitsObject: CharacterTraits;
    };

    if (!traitsArray || !Array.isArray(traitsArray) || !traitsObject)
      return res
        .status(400)
        .json({ error: 'No traitsArray or traitsObject provided' });

    const traitImages = await Promise.all(
      traitsArray.map(async trait => {
        const url = getImageUrl(trait);
        const image = await Jimp.read(url);
        return image.resize(700, Jimp.AUTO);
      }),
    );

    const imageComposite = traitImages.reduce((acc, image) => {
      return acc.composite(image, 0, 0);
    });

    const fileContents = await imageComposite
      .quality(85)
      .getBufferAsync(Jimp.MIME_JPEG);

    const attributes = getAttributesFromTraitsObject(traitsObject);
    const cid = await uploadToPinata(fileContents, 'characterAvater.jpg');
    if (!cid) {
      return res.status(500).json({ error: 'Something went wrong' });
    }

    return res.status(200).json({ attributes, cid });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
