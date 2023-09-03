import formidable from 'formidable';
import type { NextApiRequest, NextApiResponse, PageConfig } from 'next';
import { Writable } from 'stream';
import { File } from 'web3.storage';

import { uploadToWeb3Storage } from '@/lib/fileStorage';

export const config: PageConfig = {
  api: {
    bodyParser: false,
  },
};

const formidableConfig = {
  keepExtensions: true,
  maxFileSize: 1_000_000,
  maxFieldsSize: 1_000_000,
  maxFields: 2,
  allowEmptyFiles: false,
  multiples: false,
};

const formidablePromise = (
  req: NextApiRequest,
  opts?: Parameters<typeof formidable>[0],
): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
  return new Promise((accept, reject) => {
    const form = formidable(opts);

    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err);
      }
      return accept({ fields, files });
    });
  });
};

const fileConsumer = <T = unknown>(acc: T[]) => {
  const writable = new Writable({
    write: (chunk, _enc, next) => {
      acc.push(chunk);
      next();
    },
  });

  return writable;
};

type ResponseData = {
  url?: string;
  error?: string;
};

export default async function uploadFile(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  const chunks: never[] = [];

  try {
    const { files } = await formidablePromise(req, {
      ...formidableConfig,
      // consume this, otherwise formidable tries to save the file to disk
      fileWriteStreamHandler: () => fileConsumer(chunks),
    });

    const fileName = Object.keys(files)[0];
    const fileContents = Buffer.concat(chunks);
    const file = new File([fileContents], fileName);

    const cid = await uploadToWeb3Storage(file);

    res.status(200).json({ url: `https://ipfs.io/ipfs/${cid}/${fileName}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
}
