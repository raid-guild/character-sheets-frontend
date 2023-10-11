import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import { createConfig } from 'wagmi';

import {
  chains,
  PROJECT_ID,
  publicClient,
  webSocketPublicClient,
} from './config';

// Required for BigInt serialization
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

const { connectors } = getDefaultWallets({
  appName: 'CharacterSheets',
  projectId: PROJECT_ID,
  chains,
});

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

export { DEFAULT_CHAIN, INFURA_KEY, publicClient } from './config';
