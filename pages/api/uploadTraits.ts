import formidable from 'formidable';
import Jimp from 'jimp';
import type { NextApiRequest, NextApiResponse, PageConfig } from 'next';
import { File } from 'web3.storage';

import { uploadToWeb3Storage } from '@/lib/fileStorage';

export const config: PageConfig = {
  api: {
    bodyParser: false,
  },
};

type ResponseData = {
  cid?: string;
  error?: string;
};

type FormFile = {
  _writeStream: {
    path: string;
  };
};

export default async function uploadTraits(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  const form = formidable({});
  let files;
  try {
    [, files] = await form.parse(req);

    const formFile0 = files?.layer0 as [FormFile] | undefined;
    const formFile1 = files?.layer1 as [FormFile] | undefined;
    const formFile2 = files?.layer2 as [FormFile] | undefined;
    const formFile3 = files?.layer3 as [FormFile] | undefined;
    const formFile4 = files?.layer4 as [FormFile] | undefined;
    const formFile5 = files?.layer5 as [FormFile] | undefined;

    if (
      !(
        formFile0 &&
        formFile1 &&
        formFile2 &&
        formFile3 &&
        formFile4 &&
        formFile5
      )
    ) {
      return res.status(400).json({ error: 'Missing layers' });
    }

    const image0 = await Jimp.read(formFile0[0]._writeStream.path);
    const image1 = await Jimp.read(formFile1[0]._writeStream.path);
    const image2 = await Jimp.read(formFile2[0]._writeStream.path);
    const image3 = await Jimp.read(formFile3[0]._writeStream.path);
    const image4 = await Jimp.read(formFile4[0]._writeStream.path);
    const image5 = await Jimp.read(formFile5[0]._writeStream.path);

    image0.composite(image1, 0, 0);
    image0.composite(image2, 0, 0);
    image0.composite(image3, 0, 0);
    image0.composite(image4, 0, 0);
    image0.composite(image5, 0, 0);

    const fileContents = await image0.getBufferAsync(Jimp.MIME_PNG);

    const file = new File([fileContents], 'characterAvater.png');

    const cid = await uploadToWeb3Storage(file);

    return res.status(200).json({ cid });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
