import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import { Chain, configureChains, createConfig } from 'wagmi';
import { goerli, sepolia } from 'wagmi/chains';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { infuraProvider } from 'wagmi/providers/infura';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import { publicProvider } from 'wagmi/providers/public';

if (!process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID) {
  throw new Error(
    `Invalid/Missing environment variable: "NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID"`,
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

export const { chains, publicClient, webSocketPublicClient } = configureChains(
  [DEFAULT_CHAIN],
  [
    infuraProvider({ apiKey: process.env.NEXT_PUBLIC_INFURA_KEY ?? '' }),
    alchemyProvider({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_KEY ?? '' }),
    jsonRpcProvider({
      rpc: (localChain: Chain) => ({
        http: localChain.rpcUrls.default.http[0],
      }),
    }),
    publicProvider(),
  ],
);

const { connectors } = getDefaultWallets({
  appName: 'CharacterSheets',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
  chains,
});

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});
