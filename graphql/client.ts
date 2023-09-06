import { createClient, fetchExchange } from 'urql';

import { DEFAULT_CHAIN } from '@/lib/web3';
import { SUBGRAPH_URLS } from '@/utils/constants';

const SUBGRAPH_URL = SUBGRAPH_URLS[DEFAULT_CHAIN.id];

if (!SUBGRAPH_URL) {
  throw new Error(`No subgraph configured for chain ${DEFAULT_CHAIN.network}`);
}

export const SUBGRAPH_NAME = SUBGRAPH_URL.replace(
  'https://api.thegraph.com/subgraphs/name/',
  '',
);

export const client = createClient({
  url: SUBGRAPH_URL,
  exchanges: [fetchExchange],
});
