import type { NextApiRequest, NextApiResponse } from 'next';
import { File } from 'web3.storage';

import { uploadToWeb3Storage } from '@/lib/fileStorage';

type ResponseData = {
  cid?: string;
  error?: string;
};

export default async function uploadMetadata(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  try {
    const fileName = req.query.name as string;
    const metadata = req.body;

    const fileContents = Buffer.from(metadata);
    const file = new File([fileContents], fileName);

    const cid = await uploadToWeb3Storage(file);

    res.status(200).json({ cid });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
}
