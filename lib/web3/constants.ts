import { Chain, gnosis, goerli, mainnet } from 'wagmi/chains';

import { ENVIRONMENT } from '@/utils/constants';

export const INFURA_KEY: string = process.env.NEXT_PUBLIC_INFURA_KEY!;
export const SERVER_INFURA_KEY: string = process.env.SERVER_INFURA_KEY!;

export const WALLET_CONNECT_PROJECT_ID: string =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!;

export const EXPLORER_URLS: { [key: number]: string } = {
  [100]: 'https://gnosisscan.io',
  [5]: 'https://goerli.etherscan.io',
};

export const SUBGRAPH_URLS: { [key: number]: string } = {
  [100]:
    'https://api.thegraph.com/subgraphs/name/ecwireless/character-sheets-gnosis',
  [5]: 'https://api.thegraph.com/subgraphs/name/ecwireless/character-sheets-goerli',
};

export const RPC_URLS: { [key: number]: string } = {
  [100]: 'https://rpc.gnosis.gateway.fm',
  [5]: `https://goerli.infura.io/v3/${INFURA_KEY}`,
  [1]: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
};

export const SERVER_RPC_URLS: { [key: number]: string } = {
  [100]: 'https://rpc.gnosis.gateway.fm',
  [5]: `https://goerli.infura.io/v3/${SERVER_INFURA_KEY}`,
  [1]: `https://mainnet.infura.io/v3/${SERVER_INFURA_KEY}`,
};

export const CHAINS: { [key: number]: Chain } = {
  [100]: gnosis,
  [5]: goerli,
  [1]: mainnet,
};

export const CHAIN_LABEL_TO_ID: { [key: string]: number } = {
  gnosis: 100,
  goerli: 5,
};

export const CHAIN_ID_TO_IMAGE: { [key: number]: string } = {
  100: '/images/gnosis.svg',
  5: '/images/ethereum.svg',
  1: '/images/ethereum.svg',
  420: '/images/optimism.svg',
  137: '/images/polygon.svg',
  42161: '/images/arbitrum.svg',
};

export const CHAIN_ID_TO_LABEL: { [key: number]: string } = {
  100: 'gnosis',
  5: 'goerli',
};

const ALL_SUPPORTED_CHAINS: Chain[] = [gnosis, goerli];

export const SUPPORTED_CHAINS: Chain[] = (() => {
  switch (ENVIRONMENT) {
    case 'main':
      return ALL_SUPPORTED_CHAINS.filter(chain => chain.testnet === false);
    case 'dev':
    default:
      return ALL_SUPPORTED_CHAINS.filter(chain => chain.testnet === true);
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
