import { Client, createClient, fetchExchange } from 'urql';

import { getSubgraphUrl, isSupportedChain, SUPPORTED_CHAINS } from '@/lib/web3';

const GRAPH_CLIENTS: Record<number, Client> = SUPPORTED_CHAINS.reduce(
  (clients, chain) => ({
    ...clients,
    [chain.id]: createClient({
      url: getSubgraphUrl(chain.id),
      exchanges: [fetchExchange],
    }),
  }),
  {},
);

export const getGraphClient = (chainId: number): Client => {
  if (!isSupportedChain(chainId)) {
    throw new Error(`No graph client for chain ${chainId}`);
  }
  return GRAPH_CLIENTS[chainId];
};

export const defaultClient = getGraphClient(SUPPORTED_CHAINS[0].id);
