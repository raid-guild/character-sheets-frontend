import { createClient, fetchExchange } from 'urql';

const SUBGRAPH_URL =
  process.env.NEXT_PUBLIC_SUBGRAPH_URL ||
  'https://api.thegraph.com/subgraphs/name/dan13ram/character-sheets-goerli';

export const client = createClient({
  url: SUBGRAPH_URL,
  exchanges: [fetchExchange],
});
