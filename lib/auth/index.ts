import { NextApiRequest, NextApiResponse } from 'next';
import { getAddress } from 'viem';

import { readClient } from '../web3';

export const withAuth =
  (
    handler: (
      account: `0x${string}`,
      req: NextApiRequest,
      res: NextApiResponse,
    ) => Promise<unknown>,
  ) =>
  async (req: NextApiRequest, res: NextApiResponse): Promise<unknown> => {
    const { headers, url } = req;

    const {
      'x-account-address': accountAddress,
      'x-account-signature': accountSignature,
    } = headers;

    const message = (url || '').split('?')[0];

    if (!accountAddress || !accountSignature) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const isVerified = await readClient.verifyMessage({
      address: accountAddress as `0x${string}`,
      message: message,
      signature: accountSignature as `0x${string}`,
    });

    if (!isVerified) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return handler(getAddress(accountAddress as string), req, res);
  };
