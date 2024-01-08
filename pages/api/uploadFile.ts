import formidable from 'formidable';
import fs from 'fs';
import Jimp from 'jimp';
import type { NextApiRequest, NextApiResponse, PageConfig } from 'next';

import { uploadToPinata } from '@/lib/fileStorage';

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

  let isSvg = false;
  form.on('file', (_, file) => {
    const mimeType = file.mimetype;

    if (mimeType === 'image/svg+xml') {
      isSvg = true;
    }
  });

  try {
    const [, files] = await form.parse(req);
    const formFile = files[fileName] as [FormFile] | undefined;

    if (!formFile) {
      return res.status(400).json({ error: 'No file provided' });
    }

    let fileContents: Buffer;

    if (isSvg) {
      fileContents = fs.readFileSync(formFile[0]._writeStream.path);
    } else {
      const image = await Jimp.read(formFile[0]._writeStream.path);
      fileContents = await image
        .resize(700, Jimp.AUTO)
        .getBufferAsync(Jimp.MIME_PNG);
    }

    const cid = await uploadToPinata(fileContents, `${fileName}.png`);
    if (!cid) {
      return res.status(500).json({ error: 'Error uploading file' });
    }

    return res.status(200).json({ cid });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
