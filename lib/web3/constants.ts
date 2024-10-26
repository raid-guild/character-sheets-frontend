import { Chain, fallback, http, Transport } from 'viem';
import {
  arbitrum,
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

const INFURA_KEY = process.env.NEXT_PUBLIC_INFURA_KEY;
const ALCHEMY_KEY = process.env.NEXT_PUBLIC_ALCHEMY_KEY;
const PORTERS_KEY = process.env.NEXT_PUBLIC_PORTERS_KEY ?? 'wrb6GCyjbz';

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

const infuraNetworkName: { [key: number]: string } = {
  [mainnet.id]: 'mainnet',
  [polygon.id]: 'polygon-mainnet',
  [optimism.id]: 'optimism-mainnet',
  [sepolia.id]: 'sepolia',
  [base.id]: 'base-mainnet',
  // gnosis is not supported by infura
};

const alchemyNetworkName: { [key: number]: string } = {
  [mainnet.id]: 'eth-mainnet',
  [polygon.id]: 'polygon-mainnet',
  [optimism.id]: 'opt-mainnet',
  [sepolia.id]: 'eth-sepolia',
  [base.id]: 'base-mainnet',
  // gnosis is not supported by alchemy
};

const portersNetworkName: { [key: number]: string } = {
  [mainnet.id]: 'eth-mainnet',
  [polygon.id]: 'poly-mainnet',
  [optimism.id]: 'optimism-mainnet',
  [sepolia.id]: 'sepolia-testnet',
  [base.id]: 'base-fullnode-mainnet',
  [gnosis.id]: 'gnosischain-mainnet',
};

const DEFAULT_PC_URLS: { [key: number]: string } = {
  [gnosis.id]: 'https://rpc.gnosis.gateway.fm',
  [base.id]: 'https://mainnet.base.org',
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
  [arbitrum.id]: '/images/arbitrum.svg',
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

const chains: _chains = [gnosis, sepolia, polygon, optimism, base];

export const SUPPORTED_CHAINS: _chains = (() => {
  switch (ENVIRONMENT) {
    case 'main':
      return chains.filter(
        chain => !!chain.testnet === false,
      ) as unknown as _chains;
    case 'dev':
    default:
      return chains.filter(
        chain => chain.testnet === true,
      ) as unknown as _chains;
  }
})();

type _transports = Record<number, Transport>;

export const TRANSPORTS: _transports = [...chains, mainnet].reduce(
  (acc: _transports, chain: Chain) => {
    const list = [http()];

    const defaultRPCUrl = DEFAULT_PC_URLS[chain.id];
    if (defaultRPCUrl) list.push(http(defaultRPCUrl));

    const infuraNetwork = infuraNetworkName[chain.id];
    const infuraUrl =
      infuraNetwork && INFURA_KEY
        ? `https://${infuraNetwork}.infura.io/v3/${INFURA_KEY}`
        : undefined;
    if (infuraUrl) list.push(http(infuraUrl));

    const alchemyNetwork = alchemyNetworkName[chain.id];
    const alchemyUrl =
      alchemyNetwork && ALCHEMY_KEY
        ? `https://${alchemyNetwork}.g.alchemy.com/v2/${ALCHEMY_KEY}`
        : undefined;
    if (alchemyUrl) list.push(http(alchemyUrl));

    const portersNetwork = portersNetworkName[chain.id];
    const portersUrl = portersNetwork
      ? `https://${portersNetwork}.rpc.porters.xyz/${PORTERS_KEY}`
      : undefined;
    if (portersUrl) list.push(http(portersUrl));

    return {
      ...acc,
      [chain.id]: fallback(list.reverse()),
    };
  },
  {} as _transports,
);

const validateConfig = () => {
  if (!WALLET_CONNECT_PROJECT_ID) {
    throw new Error('WALLET_CONNECT_PROJECT_ID is not set');
  }

  SUPPORTED_CHAINS.forEach(chain => {
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
