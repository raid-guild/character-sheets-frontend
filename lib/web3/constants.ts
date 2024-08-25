import { Chain } from '@rainbow-me/rainbowkit';
import {
  base,
  gnosis,
  mainnet,
  optimism,
  polygon,
  sepolia,
} from 'wagmi/chains';

import { ENVIRONMENT } from '@/utils/constants';

export const WALLET_CONNECT_PROJECT_ID: string =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!;

export const EXPLORER_URLS: { [key: number]: string } = {
  [gnosis.id]: 'https://gnosisscan.io',
  [sepolia.id]: 'https://sepolia.etherscan.io',
  [base.id]: 'https://basescan.org',
  [polygon.id]: 'https://polygonscan.com',
  [optimism.id]: 'https://optimistic.etherscan.io',
};

export const SUBGRAPH_URLS: { [key: number]: string } = {
  [gnosis.id]:
    'https://api.studio.thegraph.com/query/71457/character-sheets-gnosis/version/latest',
  [sepolia.id]:
    'https://api.studio.thegraph.com/query/71457/character-sheets-sepolia/version/latest',
  [base.id]:
    'https://api.studio.thegraph.com/query/71457/character-sheets-base/version/latest',
  [polygon.id]:
    'https://api.studio.thegraph.com/query/71457/character-sheets-polygon/version/latest',
  [optimism.id]:
    'https://api.studio.thegraph.com/query/71457/character-sheets-optimism/version/latest',
};

export const RPC_URLS: { [key: number]: string } = {
  [gnosis.id]: 'https://gnosischain-mainnet.rpc.porters.xyz/wrb6GCyjbz',
  [sepolia.id]: 'https://sepolia-testnet.rpc.porters.xyz/wrb6GCyjbz',
  [mainnet.id]: 'https://eth-mainnet.rpc.porters.xyz/wrb6GCyjbz',
  [polygon.id]: 'https://poly-mainnet.rpc.porters.xyz/wrb6GCyjbz',
  [optimism.id]: 'https://optimism-mainnet.rpc.porters.xyz/wrb6GCyjbz',
  [base.id]: 'https://base-fullnode-mainnet.rpc.porters.xyz/wrb6GCyjbz',
};

export const SERVER_RPC_URLS: { [key: number]: string } = {
  [gnosis.id]: 'https://gnosischain-mainnet.rpc.porters.xyz/wrb6GCyjbz',
  [sepolia.id]: 'https://sepolia-testnet.rpc.porters.xyz/wrb6GCyjbz',
  [mainnet.id]: 'https://eth-mainnet.rpc.porters.xyz/wrb6GCyjbz',
  [polygon.id]: 'https://poly-mainnet.rpc.porters.xyz/wrb6GCyjbz',
  [optimism.id]: 'https://optimism-mainnet.rpc.porters.xyz/wrb6GCyjbz',
  [base.id]: 'https://base-fullnode-mainnet.rpc.porters.xyz/wrb6GCyjbz',
};

export const CHAINS: { [key: number]: Chain } = {
  [gnosis.id]: gnosis,
  [sepolia.id]: sepolia,
  [mainnet.id]: mainnet,
  [polygon.id]: polygon,
  [optimism.id]: optimism,
  [base.id]: base,
};

export const CHAIN_LABEL_TO_ID: { [key: string]: number } = {
  gnosis: gnosis.id,
  sepolia: sepolia.id,
  mainnet: mainnet.id,
  polygon: polygon.id,
  optimism: optimism.id,
  base: base.id,
};

export const CHAIN_ID_TO_IMAGE: { [key: number]: string } = {
  [gnosis.id]: '/images/gnosis.svg',
  [sepolia.id]: '/images/ethereum.svg',
  [mainnet.id]: '/images/ethereum.svg',
  [optimism.id]: '/images/optimism.svg',
  [polygon.id]: '/images/polygon.svg',
  [base.id]: '/images/base.svg',
  42161: '/images/arbitrum.svg',
};

export const CHAIN_ID_TO_LABEL: { [key: number]: string } = {
  [gnosis.id]: 'gnosis',
  [sepolia.id]: 'sepolia',
  [mainnet.id]: 'mainnet',
  [polygon.id]: 'polygon',
  [optimism.id]: 'optimism',
  [base.id]: 'base',
};

type _chains = readonly [Chain, ...Chain[]];

const ALL_SUPPORTED_CHAINS: _chains = [
  gnosis,
  sepolia,
  polygon,
  optimism,
  base,
];

export const SUPPORTED_CHAINS: _chains = (() => {
  switch (ENVIRONMENT) {
    case 'main':
      return ALL_SUPPORTED_CHAINS.filter(
        chain => !!chain.testnet === false,
      ) as unknown as _chains;
    case 'dev':
    default:
      return ALL_SUPPORTED_CHAINS.filter(
        chain => chain.testnet === true,
      ) as unknown as _chains;
  }
})();

const validateConfig = () => {
  if (!WALLET_CONNECT_PROJECT_ID) {
    throw new Error('WALLET_CONNECT_PROJECT_ID is not set');
  }

  SUPPORTED_CHAINS.forEach(chain => {
    if (!RPC_URLS[chain.id]) {
      throw new Error(`RPC_URLS[${chain.id}] is not set`);
    }

    if (!EXPLORER_URLS[chain.id]) {
      throw new Error(`EXPLORER_URLS[${chain.id}] is not set`);
    }

    if (!SUBGRAPH_URLS[chain.id]) {
      throw new Error(`SUBGRAPH_URLS[${chain.id}] is not set`);
    }

    if (!CHAIN_ID_TO_LABEL[chain.id]) {
      throw new Error(`CHAIN_ID_TO_LABEL[${chain.id}] is not set`);
    }

    if (
      !CHAIN_LABEL_TO_ID[CHAIN_ID_TO_LABEL[chain.id]] ||
      CHAIN_LABEL_TO_ID[CHAIN_ID_TO_LABEL[chain.id]] !== chain.id
    ) {
      throw new Error(
        `CHAIN_LABEL_TO_ID[${
          CHAIN_ID_TO_LABEL[chain.id]
        }] is not set or does not match ${chain.id}`,
      );
    }
  });
};

validateConfig();
