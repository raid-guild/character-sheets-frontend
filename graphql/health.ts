import { gql, request } from 'graphql-request';

import { getReadClient, getSubgraphName, SUPPORTED_CHAINS } from '@/lib/web3';
import { timeout } from '@/utils/helpers';

const GRAPH_HEALTH_ENDPOINT = 'https://api.thegraph.com/index-node/graphql';

const statusQuery = gql`
  query getSubgraphStatus($subgraph: String!) {
    status: indexingStatusForCurrentVersion(subgraphName: $subgraph) {
      chains {
        latestBlock {
          number
        }
      }
    }
  }
`;

const getSyncedBlock = async (subgraph: string): Promise<bigint> => {
  const data = await request(GRAPH_HEALTH_ENDPOINT, statusQuery, {
    subgraph,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return BigInt((data as any)?.status?.chains[0]?.latestBlock?.number || 0);
};

const getLatestBlock = async (chainId: number): Promise<bigint> => {
  const readClient = getReadClient(chainId);
  const latestBlock = await readClient.getBlockNumber();
  return BigInt(latestBlock);
};

const getSubgraphHealth = async (
  subgraph: Subgraph,
): Promise<SubgraphHealth> => {
  try {
    const syncedBlock = await getSyncedBlock(subgraph.name);
    const latestBlock = await getLatestBlock(subgraph.chainId);
    const isHealthy = Number(latestBlock - syncedBlock) <= HEALTH_THRESHOLD;
    return {
      syncedBlock,
      latestBlock,
      isHealthy,
    };
  } catch (e) {
    console.error(`Failed to get subgraph health for ${subgraph.name}`, e);
    return {
      syncedBlock: BigInt(0),
      latestBlock: BigInt(0),
      isHealthy: false,
    };
  }
};

const UPDATE_INTERVAL = 10000;
const HEALTH_THRESHOLD = 10;

type Subgraph = {
  name: string;
  chainId: number;
};

export type SubgraphHealth = {
  syncedBlock: bigint;
  latestBlock: bigint;
  isHealthy: boolean;
};

class SubgraphHealthStore {
  graphHealth: Record<number, SubgraphHealth> = {};
  subgraphs: Array<Subgraph> = [];

  constructor() {
    SUPPORTED_CHAINS.forEach(chain => {
      try {
        const subgraphName = getSubgraphName(chain.id);
        this.subgraphs.push({
          name: subgraphName,
          chainId: chain.id,
        });
        this.graphHealth[chain.id] = {
          syncedBlock: BigInt(0),
          latestBlock: BigInt(0),
          isHealthy: false,
        };
      } catch (e) {
        console.error(`Failed to get subgraph name for chain ${chain.id}`, e);
      }
    });
    this.updateSubgraphHealth();
  }

  public async updateSubgraphHealth() {
    await Promise.all(
      this.subgraphs.map(async subgraph => {
        this.graphHealth[subgraph.chainId] = await getSubgraphHealth(subgraph);
      }),
    );
    setTimeout(() => this.updateSubgraphHealth(), UPDATE_INTERVAL);
  }

  status() {
    return this.graphHealth;
  }
}

const HealthStoreSingleton = (function () {
  let instance: SubgraphHealthStore;

  function createInstance() {
    return new SubgraphHealthStore();
  }

  return {
    getInstance: function () {
      if (!instance) {
        instance = createInstance();
      }
      return instance;
    },
  };
})();

export const getAllSubgraphHealthStatus = (): Record<number, SubgraphHealth> =>
  HealthStoreSingleton.getInstance().status();

const initSubgraphHealthStore = getAllSubgraphHealthStatus;

if (typeof window !== 'undefined') {
  initSubgraphHealthStore();
}

export const getSubgraphHealthStatus = (chainId: number): SubgraphHealth => {
  const health = getAllSubgraphHealthStatus();
  if (!health[chainId]) {
    throw new Error(`No health status for chain ${chainId}`);
  }
  return health[chainId];
};

const GRAPH_POLL_INTERVAL = 5000;
const GRAPH_NUM_RETRIES = 20;

export const waitUntilBlock = async (
  chainId: number,
  block: bigint,
): Promise<boolean> => {
  let { syncedBlock } = getSubgraphHealthStatus(chainId);
  let tries = 0;
  while (syncedBlock < block && tries < GRAPH_NUM_RETRIES) {
    await timeout(GRAPH_POLL_INTERVAL);
    tries += 1;
    ({ syncedBlock } = getSubgraphHealthStatus(chainId));
  }
  return syncedBlock >= block;
};
