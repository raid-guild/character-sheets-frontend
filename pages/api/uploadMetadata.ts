import type { NextApiRequest, NextApiResponse } from 'next';

import { uploadToPinata } from '@/lib/fileStorage';

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

    const cid = await uploadToPinata(fileContents, fileName);
    if (!cid) {
      return res.status(500).json({ error: 'Error uploading file' });
    }

    return res.status(200).json({ cid });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
