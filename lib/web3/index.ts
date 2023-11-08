import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import { createConfig } from 'wagmi';

import { chains, publicClient, webSocketPublicClient } from './config';
import { WALLET_CONNECT_PROJECT_ID } from './constants';

// Required for BigInt serialization
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

const { connectors } = getDefaultWallets({
  appName: 'CharacterSheets',
  projectId: WALLET_CONNECT_PROJECT_ID,
  chains,
});

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

export * from './config';
export { SUPPORTED_CHAINS } from './constants';
export * from './helpers';
export * from './readClients';
