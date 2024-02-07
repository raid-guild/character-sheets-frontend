'use client';

import {
  darkTheme,
  RainbowKitProvider,
  getDefaultWallets,
  connectorsForWallets,
} from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, createConfig, WagmiProvider } from 'wagmi';
import {
  SUPPORTED_CHAINS,
  WALLET_CONNECT_PROJECT_ID,
} from '@/lib/web3/constants';

const { wallets } = getDefaultWallets();

const connectors = connectorsForWallets(wallets, {
  appName: 'CharacterSheets',
  projectId: WALLET_CONNECT_PROJECT_ID,
});

const transports = Object.fromEntries(
  SUPPORTED_CHAINS.map(chain => {
    return [chain.id, http()];
  }),
);

const wagmiConfig = createConfig({
  chains: SUPPORTED_CHAINS,
  connectors,
  ssr: true,
  transports,
});

const queryClient = new QueryClient();

export const Web3Provider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
