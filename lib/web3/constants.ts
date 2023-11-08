import { Chain, gnosis, goerli, mainnet } from 'wagmi/chains';

export const INFURA_KEY: string = process.env.NEXT_PUBLIC_INFURA_KEY!;

export const WALLET_CONNECT_PROJECT_ID: string =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!;

export const IS_PROD = process.env.NODE_ENV === 'production';

export const EXPLORER_URLS: { [key: number]: string } = {
  [100]: 'https://gnosisscan.io',
  [5]: 'https://goerli.etherscan.io',
};

export const SUBGRAPH_URLS: { [key: number]: string } = {
  [100]:
    'https://api.thegraph.com/subgraphs/name/dan13ram/character-sheets-gnosis',
  [5]: 'https://api.thegraph.com/subgraphs/name/dan13ram/character-sheets-goerli',
};

export const RPC_URLS: { [key: number]: string } = {
  [100]: 'https://rpc.gnosis.gateway.fm',
  [5]: `https://goerli.infura.io/v3/${INFURA_KEY}`,
  [1]: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
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

const PROD_SUPPORTED_CHAINS: Chain[] = [gnosis];

const DEV_SUPPORTED_CHAINS: Chain[] = [goerli];

export const SUPPORTED_CHAINS: Chain[] = IS_PROD
  ? PROD_SUPPORTED_CHAINS
  : DEV_SUPPORTED_CHAINS;

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
  });
};

validateConfig();
