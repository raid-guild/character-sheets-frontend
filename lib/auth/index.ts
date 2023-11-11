import { NextApiRequest, NextApiResponse } from 'next';
import { Address, createPublicClient, getAddress, http } from 'viem';

import { CHAINS, SERVER_RPC_URLS } from '../web3/constants';

export type AccountInfo = {
  address: Address;
  chainId: number;
};

export const withAuth =
  (
    handler: (
      account: AccountInfo,
      req: NextApiRequest,
      res: NextApiResponse,
    ) => Promise<unknown>,
  ) =>
  async (req: NextApiRequest, res: NextApiResponse): Promise<unknown> => {
    const { headers, url } = req;

    const {
      'x-account-address': accountAddress,
      'x-account-signature': accountSignature,
      'x-account-chain-id': accountChainId,
    } = headers;

    const message = (url || '').split('?')[0];

    if (!accountAddress || !accountSignature) {
      console.error('[AUTH] Missing account address or signature');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const readClient = createPublicClient({
      chain: CHAINS[Number(accountChainId)],
      transport: http(SERVER_RPC_URLS[Number(accountChainId)]),
    });

    if (!readClient) {
      console.error('[AUTH] Invalid chain id');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const isVerified = await readClient.verifyMessage({
      address: accountAddress as `0x${string}`,
      message: message,
      signature: accountSignature as `0x${string}`,
    });

    if (!isVerified) {
      console.error('[AUTH] Invalid signature');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return handler(
      {
        address: getAddress(accountAddress as string),
        chainId: Number(accountChainId),
      },
      req,
      res,
    );
  };
