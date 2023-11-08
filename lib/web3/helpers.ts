import { isAddress, isHash, PublicClient } from 'viem';

import {
  CHAIN_LABEL_TO_ID,
  EXPLORER_URLS,
  RPC_URLS,
  SUBGRAPH_URLS,
  SUPPORTED_CHAINS,
} from './constants';
import { READ_CLIENTS } from './readClients';

export const isSupportedChain = (chainId: number | string | bigint): boolean =>
  SUPPORTED_CHAINS.find(c => c.id === Number(chainId)) !== undefined;

export const getChainIdFromLabel = (chainLabel: string): number | undefined => {
  if (!chainLabel || !isSupportedChain(chainLabel)) {
    return undefined;
  }
  return CHAIN_LABEL_TO_ID[chainLabel];
};

export const getRPCUrl = (chainId: number): string => {
  if (!isSupportedChain(chainId)) {
    throw new Error(`ChainId ${chainId} is not supported`);
  }
  return RPC_URLS[chainId]!;
};

export const getSubgraphUrl = (chainId: number): string => {
  if (!isSupportedChain(chainId)) {
    throw new Error(`ChainId ${chainId} is not supported`);
  }
  return SUBGRAPH_URLS[chainId]!;
};

export const getSubgraphName = (chainId: number): string => {
  const subgraphUrl = getSubgraphUrl(chainId);
  const subgraphName = subgraphUrl.split(
    'https://api.thegraph.com/subgraphs/name/',
  )[1];
  if (!subgraphName) {
    throw new Error(`Subgraph name not found for chainId ${chainId}`);
  }

  return subgraphName;
};

export const getExplorerUrl = (chainId: number): string => {
  if (!isSupportedChain(chainId)) {
    throw new Error(`ChainId ${chainId} is not supported`);
  }
  return EXPLORER_URLS[chainId]!;
};

export const getTxUrl = (chainId: number, txHash: string): string => {
  if (!isHash(txHash) || txHash.length !== 66) {
    throw new Error(`Tx hash ${txHash} is not valid`);
  }
  const explorerUrl = getExplorerUrl(chainId);
  return `${explorerUrl}/tx/${txHash}`;
};

export const getAddressUrl = (chainId: number, address: string): string => {
  if (!isAddress(address)) {
    throw new Error(`Address ${address} is not valid`);
  }
  const explorerUrl = getExplorerUrl(chainId);
  return `${explorerUrl}/address/${address}`;
};

export const getReadClient = (chainId: number): PublicClient => {
  const readClient = READ_CLIENTS[chainId];
  if (!readClient) {
    throw new Error(`Read client not found for chainId ${chainId}`);
  }
  return readClient;
};
