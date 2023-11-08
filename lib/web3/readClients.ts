import { createPublicClient, http, PublicClient } from 'viem';

import { CHAINS, RPC_URLS } from './constants';

export const READ_CLIENTS: { [key: number]: PublicClient } = (() => {
  const clients: { [key: number]: PublicClient } = {};
  Object.keys(RPC_URLS).forEach(chainId => {
    clients[Number(chainId)] = createPublicClient({
      chain: CHAINS[Number(chainId)],
      transport: http(RPC_URLS[Number(chainId)]),
    });
  });
  return clients;
})();
