import { timeout } from '@/utils/helpers';

import { GetMetaDocument } from './autogen/types';
import { getGraphClient } from './client';

const GRAPH_POLL_INTERVAL = 5000;
const GRAPH_NUM_RETRIES = 20;

const getSubgraphBlockNumber = async (chainId: number) => {
  try {
    const { data, error } = await getGraphClient(chainId).query(
      GetMetaDocument,
      {},
    );

    if (error) {
      console.error('Error querying subgraph meta', error);
      return BigInt(0);
    }

    return BigInt(data?._meta?.block?.number);
  } catch (e) {
    console.error(
      `Failed to get subgraph block number for chain ${chainId}`,
      e,
    );
    return BigInt(0);
  }
};

export const awaitSubgraphSync = async (
  chainId: number,
  transactionBlockNumber: bigint,
): Promise<boolean> => {
  let subgraphBlockNumber = await getSubgraphBlockNumber(chainId);

  let tries = 0;
  while (
    subgraphBlockNumber < transactionBlockNumber &&
    tries < GRAPH_NUM_RETRIES
  ) {
    await timeout(GRAPH_POLL_INTERVAL);
    tries += 1;
    subgraphBlockNumber = await getSubgraphBlockNumber(chainId);
  }
  return subgraphBlockNumber >= transactionBlockNumber;
};
