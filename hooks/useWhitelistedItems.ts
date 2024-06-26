import { useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { usePublicClient } from 'wagmi';

import { useGame } from '@/contexts/GameContext';

import { getClaimNonce } from './useClaimNonce';

export type WhitelistItemLeaf = [bigint, `0x${string}`, bigint, bigint]; // itemId, address, nonce, amount

type FetcherInput = {
  gameAddress: string;
  itemsAddress: string;
  chainId: string;
  character: string;
};

const getLeaves = async ({
  gameAddress,
  chainId,
  character,
}: FetcherInput): Promise<Array<WhitelistItemLeaf>> => {
  try {
    const uri = `/api/getWhitelistedTreeLeaves?gameAddress=${gameAddress}&chainId=${chainId}&character=${character}`;

    const data = await fetch(uri);
    const leaves = await data.json();

    if (!leaves || !leaves.length) {
      return [];
    }

    return leaves.map((leaf: WhitelistItemLeaf) => [
      BigInt(leaf[0]),
      leaf[1] as `0x${string}`,
      BigInt(leaf[2]),
      BigInt(leaf[3]),
    ]);
  } catch (e) {
    return [];
  }
};

export type WhitelistedItem = {
  itemId: string;
  amount: string;
};

const getWhitelistedItems = async (
  publicClient: ReturnType<typeof usePublicClient>,
  input: FetcherInput,
): Promise<Array<WhitelistedItem> | null> => {
  if (!publicClient) return null;
  try {
    const leaves = await getLeaves(input);
    const itemIds = leaves.map(leaf => leaf[0].toString());

    const nonceMap = leaves.reduce((acc, leaf) => {
      acc[leaf[0].toString()] = leaf[2];
      return acc;
    }, {} as Record<string, bigint>);

    const noncesFromContract = await Promise.all(
      itemIds.map(async itemId =>
        getClaimNonce(
          publicClient,
          input.itemsAddress as `0x${string}`,
          BigInt(itemId),
          input.character as `0x${string}`,
        ),
      ),
    );

    const validItemIds = itemIds.filter((itemId, i) => {
      return noncesFromContract[i] === nonceMap[itemId];
    });

    return validItemIds.map(itemId => {
      const leaf = leaves.find(leaf => leaf[0].toString() === itemId);
      return {
        itemId,
        amount: leaf ? leaf[3].toString() : '0',
      };
    });
  } catch (e) {
    console.error('Error fetching whitelisted items', e);
    return null;
  }
};

type WhitelistedItems = {
  items: Array<WhitelistedItem>;
};

export const useWhitelistedItems = (): {
  whitelistedItems: WhitelistedItems | null;
  reload: () => void;
  loading: boolean;
  error: Error | null;
} => {
  const { game, character } = useGame();
  const { id: gameAddress, itemsAddress, chainId } = game || {};

  const input: FetcherInput = useMemo(
    () => ({
      gameAddress: gameAddress ? gameAddress.toString() : '',
      itemsAddress: itemsAddress ? itemsAddress.toString() : '',
      chainId: chainId ? chainId.toString() : '',
      character: character ? character.account.toString() : '',
    }),
    [gameAddress, itemsAddress, chainId, character],
  );

  const publicClient = usePublicClient();

  const fetcher = useCallback(
    async (_input: FetcherInput) => {
      const items = await getWhitelistedItems(publicClient, _input);
      if (!items) return null;
      return { items };
    },
    [publicClient],
  );

  const { data, error, mutate, isLoading, isValidating } = useSWR<
    WhitelistedItems | null,
    Error,
    FetcherInput
  >(input, fetcher, {
    isPaused: () => !gameAddress || !character || !chainId,
  });

  return {
    whitelistedItems: data || null,
    loading: isLoading || isValidating,
    error: error || null,
    reload: mutate,
  };
};
