export const EXPLORER_URLS: { [key: number]: string } = {
  [11155111]: 'https://sepolia.etherscan.io',
  [5]: 'https://goerli.etherscan.io',
};

export const DEFAULT_DAO_ADDRESSES: { [key: number]: string } = {
  [11155111]: '0x1E72EE79B681e69f807Fcc9BD14Ab806BfD62553',
  [5]: '0x36a47AD35F782Fc922b15727b4df64Ea7A3735E5',
};

export const SUBGRAPH_URLS: { [key: number]: string } = {
  [11155111]:
    'https://api.studio.thegraph.com/query/3024/character-sheets-sepolia/version/latest',
  [5]: 'https://api.thegraph.com/subgraphs/name/dan13ram/character-sheets-goerli',
};
