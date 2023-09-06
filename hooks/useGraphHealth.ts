import { gql, request } from 'graphql-request';
import { useCallback, useEffect, useState } from 'react';
import { singletonHook } from 'react-singleton-hook';

import { SUBGRAPH_NAME } from '@/graphql/client';
import { timeout } from '@/utils/helpers';

export type GraphHealth = {
  isReachable: boolean;
  isFailed: boolean;
  isSynced: boolean;
  latestBlockNumber: number;
  chainHeadBlockNumber: number;
};

const GRAPH_HEALTH_STORAGE_KEY = `character-sheets-graph-health-${SUBGRAPH_NAME}`;
const GRAPH_SYNC_THRESHOLD_BLOCKS = 10;
const GRAPH_HEALTH_ENDPOINT = 'https://api.thegraph.com/index-node/graphql';

const GRAPH_HEALTH_UPDATE_INTERVAL = 10000;
const GRAPH_POLL_INTERVAL = 5000;
const GRAPH_NUM_RETRIES = 20;

export const successStatus: GraphHealth = {
  isReachable: true,
  isFailed: false,
  isSynced: true,
  latestBlockNumber: 0,
  chainHeadBlockNumber: 0,
};

export const failedStatus: GraphHealth = {
  isReachable: false,
  isFailed: true,
  isSynced: false,
  latestBlockNumber: 0,
  chainHeadBlockNumber: 0,
};

const healthQuery = gql`
  query getGraphHealth($subgraph: String!) {
    health: indexingStatusForCurrentVersion(subgraphName: $subgraph) {
      synced
      health
      fatalError {
        message
        block {
          number
          hash
        }
        handler
      }
      chains {
        chainHeadBlock {
          number
        }
        latestBlock {
          number
        }
      }
    }
  }
`;

// eslint-disable-next-line
const extractStatus = ({ fatalError, synced, chains }: any): GraphHealth => ({
  isReachable: true,
  isFailed:
    !!fatalError ||
    (!synced &&
      Number(chains[0].chainHeadBlock.number) -
        Number(chains[0].latestBlock.number) >
        GRAPH_SYNC_THRESHOLD_BLOCKS),
  isSynced: synced,
  latestBlockNumber: Number(chains[0].latestBlock.number),
  chainHeadBlockNumber: Number(chains[0].chainHeadBlock.number),
});

export const getGraphHealth = async (): Promise<GraphHealth> => {
  try {
    const data = await request(GRAPH_HEALTH_ENDPOINT, healthQuery, {
      subgraph: SUBGRAPH_NAME,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const status = extractStatus((data as any).health);
    return status;
  } catch (graphHealthError) {
    // eslint-disable-next-line no-console
    console.error('Could not fetch graph health', graphHealthError);
  }

  return failedStatus;
};

export const getCachedSubgraphHealth = (): GraphHealth => {
  const value = window.localStorage.getItem(GRAPH_HEALTH_STORAGE_KEY);
  if (value) return JSON.parse(value) as GraphHealth;
  return failedStatus;
};

export const setCachedSubgraphHealth = (health: GraphHealth): void =>
  window.localStorage.setItem(GRAPH_HEALTH_STORAGE_KEY, JSON.stringify(health));

export const waitUntilBlock = async (block: bigint): Promise<boolean> => {
  let { latestBlockNumber } = getCachedSubgraphHealth();
  let tries = 0;
  while (latestBlockNumber < block && tries < GRAPH_NUM_RETRIES) {
    await timeout(GRAPH_POLL_INTERVAL);
    tries += 1;
    ({ latestBlockNumber } = getCachedSubgraphHealth());
  }
  return latestBlockNumber >= block;
};

const useGraphHealthImpl = (): GraphHealth => {
  const [graphHealth, setGraphHealth] = useState<GraphHealth>(successStatus);

  const updateGraphHealth = useCallback(
    () =>
      getGraphHealth().then(health => {
        setGraphHealth(health);
        setCachedSubgraphHealth(health);
      }),
    [],
  );

  useEffect(() => {
    const interval = setInterval(
      updateGraphHealth,
      GRAPH_HEALTH_UPDATE_INTERVAL,
    );
    return () => clearInterval(interval);
  }, [updateGraphHealth]);

  return graphHealth;
};

export const useGraphHealth = singletonHook(successStatus, useGraphHealthImpl);
