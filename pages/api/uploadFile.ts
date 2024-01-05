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

type FormFile = {
  _writeStream: {
    path: string;
  };
};

type ResponseData = {
  cid?: string;
  error?: string;
};

export default async function uploadFile(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  const fileName = req.query.name as string;
  const form = formidable({});

  try {
    const [, files] = await form.parse(req);
    const formFile = files[fileName] as [FormFile] | undefined;

    if (!formFile) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const image = await Jimp.read(formFile[0]._writeStream.path);
    const fileContents = await image
      .resize(700, Jimp.AUTO)
      .getBufferAsync(Jimp.MIME_PNG);
    const file = new File([fileContents], `${fileName}.png`);
    const cid = await uploadToWeb3Storage(file);

    return res.status(200).json({ cid });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
