import { createClient, fetchExchange } from 'urql';

const SUBGRAPH_URL =
  process.env.NEXT_PUBLIC_SUBGRAPH_URL ||
  'https://api.studio.thegraph.com/proxy/3024/character-sheets-sepolia/version/latest';

export const client = createClient({
  url: SUBGRAPH_URL,
  exchanges: [fetchExchange],
});
