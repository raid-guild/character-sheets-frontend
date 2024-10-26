import { createPublicClient, PublicClient } from 'viem';

import { CHAINS, TRANSPORTS } from './constants';

export const READ_CLIENTS: { [key: number]: PublicClient } = (() => {
  const clients: { [key: number]: PublicClient } = {};
  Object.keys(CHAINS).forEach(chainId => {
    clients[Number(chainId)] = createPublicClient({
      chain: CHAINS[Number(chainId)],
      transport: TRANSPORTS[Number(chainId)],
    });
  });
  return clients;
})();
