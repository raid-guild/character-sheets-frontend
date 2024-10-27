import Jimp from 'jimp';
import { Cache } from 'memory-cache';
import type { NextApiRequest, NextApiResponse } from 'next';

import { uploadToPinata } from '@/lib/fileStorage';
import {
  CharacterTraits,
  getAttributesFromTraitsObject,
  getImageUrls,
} from '@/lib/traits';
import { Attribute } from '@/utils/types';

type ResponseData = {
  attributes?: Attribute[];
  cid?: string;
  error?: string;
};

const imageCache = new Cache<string, Jimp>();

const getImageJimp = async (uri: string): Promise<Jimp> => {
  const cachedImage = imageCache.get(uri);
  if (cachedImage) {
    return cachedImage;
  }
  const urls = getImageUrls(uri);

  for (const url of urls) {
    try {
      const image = await Jimp.read(url);
      imageCache.put(uri, image, 60 * 60 * 24);
      return image;
    } catch (e) {
      console.error(`Failed to get image from ${url}`, e);
      continue;
    }
  }

  throw new Error(`Failed to get image from ${urls}`);
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
      traitsArray
        .filter(trait => trait !== '' && !trait.includes('remove'))
        .map(async trait => {
          const image = await getImageJimp(trait);
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
