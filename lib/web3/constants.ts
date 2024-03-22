import { Chain } from '@rainbow-me/rainbowkit';
import { gnosis, mainnet, sepolia } from 'wagmi/chains';

import { ENVIRONMENT } from '@/utils/constants';

export const INFURA_KEY: string = process.env.NEXT_PUBLIC_INFURA_KEY!;
export const SERVER_INFURA_KEY: string = process.env.SERVER_INFURA_KEY!;

export const WALLET_CONNECT_PROJECT_ID: string =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!;

export const EXPLORER_URLS: { [key: number]: string } = {
  [gnosis.id]: 'https://gnosisscan.io',
  [sepolia.id]: 'https://sepolia.etherscan.io',
};

export const SUBGRAPH_URLS: { [key: number]: string } = {
  [gnosis.id]:
    'https://api.thegraph.com/subgraphs/name/dan13ram/character-sheets-gnosis',
  [sepolia.id]:
    'https://api.thegraph.com/subgraphs/name/dan13ram/character-sheets-sepolia',
};

export const RPC_URLS: { [key: number]: string } = {
  [gnosis.id]: 'https://rpc.gnosis.gateway.fm',
  [sepolia.id]: `https://sepolia.infura.io/v3/${INFURA_KEY}`,
  [mainnet.id]: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
};

export const SERVER_RPC_URLS: { [key: number]: string } = {
  [gnosis.id]: 'https://rpc.gnosis.gateway.fm',
  [sepolia.id]: `https://sepolia.infura.io/v3/${SERVER_INFURA_KEY}`,
  [mainnet.id]: `https://mainnet.infura.io/v3/${SERVER_INFURA_KEY}`,
};

export const CHAINS: { [key: number]: Chain } = {
  [gnosis.id]: gnosis,
  [sepolia.id]: sepolia,
  [mainnet.id]: mainnet,
};

export const CHAIN_LABEL_TO_ID: { [key: string]: number } = {
  gnosis: gnosis.id,
  sepolia: sepolia.id,
};

export const CHAIN_ID_TO_IMAGE: { [key: number]: string } = {
  [gnosis.id]: '/images/gnosis.svg',
  [sepolia.id]: '/images/ethereum.svg',
  [mainnet.id]: '/images/ethereum.svg',
  420: '/images/optimism.svg',
  137: '/images/polygon.svg',
  42161: '/images/arbitrum.svg',
};

export const CHAIN_ID_TO_LABEL: { [key: number]: string } = {
  [gnosis.id]: 'gnosis',
  [sepolia.id]: 'sepolia',
};

type _chains = readonly [Chain, ...Chain[]];

const ALL_SUPPORTED_CHAINS: _chains = [gnosis, sepolia];

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
  if (!INFURA_KEY) {
    throw new Error('INFURA_KEY is not set');
  }

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
