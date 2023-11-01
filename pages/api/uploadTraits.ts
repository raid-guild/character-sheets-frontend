import Jimp from 'jimp';
import type { NextApiRequest, NextApiResponse } from 'next';
import { File } from 'web3.storage';

import { getImageUrl } from '@/components/JoinGame/traits';
import { uploadToWeb3Storage } from '@/lib/fileStorage';

type ResponseData = {
  cid?: string;
  error?: string;
};

export default async function uploadTraits(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { traits } = JSON.parse(req.body) as { traits: string[] };

    const traitImages = await Promise.all(
      traits.map(async trait => {
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

    const cid = await uploadToWeb3Storage(file);

    return res.status(200).json({ cid });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
