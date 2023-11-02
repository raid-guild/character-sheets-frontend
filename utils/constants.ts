export const EXPLORER_URLS: { [key: number]: string } = {
  [100]: 'https://gnosisscan.io',
  [5]: 'https://goerli.etherscan.io',
};

export const SUBGRAPH_URLS: { [key: number]: string } = {
  [100]:
    'https://api.thegraph.com/subgraphs/name/dan13ram/character-sheets-gnosis',
  [5]: 'https://api.thegraph.com/subgraphs/name/dan13ram/character-sheets-goerli',
};

export const HOSTNAME =
  typeof window !== 'undefined' ? window.location.hostname : 'localhost';

export const RAIDGUILD_HOSTNAME = process.env.NEXT_PUBLIC_RAIDGUILD_HOSTNAME;

export const RAIDGUILD_GAME_ADDRESS =
  process.env.NEXT_PUBLIC_RAIDGUILD_GAME_ADDRESS;
