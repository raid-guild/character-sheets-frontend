export const EXPLORER_URLS: { [key: number]: string } = {
  [100]: 'https://gnosisscan.io/',
  [5]: 'https://goerli.etherscan.io',
};

export const SUBGRAPH_URLS: { [key: number]: string } = {
  [100]:
    'https://api.thegraph.com/subgraphs/name/dan13ram/character-sheets-gnosis',
  [5]: 'https://api.thegraph.com/subgraphs/name/dan13ram/character-sheets-goerli',
};

export const HOSTNAME =
  typeof window !== 'undefined' ? window.location.hostname : 'localhost';

export const RAIDGUILD_HOSTNAME =
  'character-sheets-git-configure-for-raidguild-game-raidguild.vercel.app';

export const RAIDGUILD_GAME_ADDRESS =
  '0x137f532a39463c9ee9c17a5a680c8892554fc2fc';
