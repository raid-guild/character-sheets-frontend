import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import { Chain, configureChains, createConfig } from 'wagmi';
import { goerli } from 'wagmi/chains';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { infuraProvider } from 'wagmi/providers/infura';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import { publicProvider } from 'wagmi/providers/public';

if (!process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID) {
  throw new Error(
    `Invalid/Missing environment variable: "NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID"`,
  );
}

export const { chains, publicClient, webSocketPublicClient } = configureChains(
  [goerli],
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
