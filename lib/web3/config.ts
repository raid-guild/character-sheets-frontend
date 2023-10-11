import { Chain, configureChains } from 'wagmi';
import { goerli, sepolia } from 'wagmi/chains';
import { infuraProvider } from 'wagmi/providers/infura';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import { publicProvider } from 'wagmi/providers/public';

if (!process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID) {
  throw new Error(
    `Invalid/Missing environment variable: "NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID"`,
  );
}

if (!process.env.NEXT_PUBLIC_INFURA_KEY) {
  throw new Error(
    `Invalid/Missing environment variable: "NEXT_PUBLIC_INFURA_KEY"`,
  );
}

export const DEFAULT_CHAIN = (() => {
  switch (process.env.NEXT_PUBLIC_DEFAULT_CHAIN) {
    case 'sepolia':
      return sepolia;
    case 'goerli':
    default:
      return goerli;
  }
})();

export const PROJECT_ID = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;

export const INFURA_KEY = process.env.NEXT_PUBLIC_INFURA_KEY;

const infura = infuraProvider({ apiKey: INFURA_KEY });

export const RPC_URL = infura(DEFAULT_CHAIN)?.rpcUrls.http[0];

export const { chains, publicClient, webSocketPublicClient } = configureChains(
  [DEFAULT_CHAIN],
  [
    infuraProvider({ apiKey: INFURA_KEY }),
    jsonRpcProvider({
      rpc: (localChain: Chain) => ({
        http: localChain.rpcUrls.default.http[0],
      }),
    }),
    publicProvider(),
  ],
);
