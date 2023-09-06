import { DEFAULT_CHAIN } from '@/lib/web3';
import { SUBGRAPH_URLS } from '@/utils/constants';
import { createClient, fetchExchange } from 'urql';

const SUBGRAPH_URL = SUBGRAPH_URLS[DEFAULT_CHAIN.id];

if (!SUBGRAPH_URL) {
  throw new Error(`No subgraph configured for chain ${DEFAULT_CHAIN.network}`);
}

export const client = createClient({
  url: SUBGRAPH_URL,
  exchanges: [fetchExchange],
});
