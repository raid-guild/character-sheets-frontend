import { getDefaultConfig } from '@rainbow-me/rainbowkit';

import { SUPPORTED_CHAINS, WALLET_CONNECT_PROJECT_ID } from './constants';

// Required for BigInt serialization
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

export const wagmiConfig = getDefaultConfig({
  appName: 'CharacterSheets',
  projectId: WALLET_CONNECT_PROJECT_ID,
  chains: SUPPORTED_CHAINS,
});

export { SUPPORTED_CHAINS } from './constants';
export * from './helpers';
export * from './readClients';
