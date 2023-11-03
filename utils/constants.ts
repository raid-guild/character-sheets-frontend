if (!process.env.NEXT_PUBLIC_RAIDGUILD_HOSTNAME) {
  throw new Error(
    `Invalid/Missing environment variable: "NEXT_PUBLIC_RAIDGUILD_HOSTNAME"`,
  );
}

if (!process.env.NEXT_PUBLIC_RAIDGUILD_GAME_ADDRESS) {
  throw new Error(
    `Invalid/Missing environment variable: "NEXT_PUBLIC_RAIDGUILD_GAME_ADDRESS"`,
  );
}

export const EXPLORER_URLS: { [key: number]: string } = {
  [100]: 'https://rpc.gnosis.gateway.fm',
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
