import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import { createConfig } from 'wagmi';

import {
  chains,
  DEFAULT_CHAIN,
  PROJECT_ID,
  RPC_URL,
  publicClient,
  webSocketPublicClient,
} from './config';
import { createPublicClient, http } from 'viem';

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

export { DEFAULT_CHAIN } from './config';

export const readClient = createPublicClient({
  chain: DEFAULT_CHAIN,
  transport: http(RPC_URL),
});
