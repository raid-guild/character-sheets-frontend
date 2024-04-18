import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { useMemo } from 'react';
import useSWR from 'swr';

import { useGame } from '@/contexts/GameContext';

export type WhitelistItemLeaf = [bigint, `0x${string}`, bigint, bigint]; // itemId, address, nonce, amount

type FetcherInput = {
  gameAddress: string;
  chainId: string;
  itemId: string;
};

const fetcher = async ({
  gameAddress,
  chainId,
  itemId,
}: FetcherInput): Promise<StandardMerkleTree<WhitelistItemLeaf> | null> => {
  try {
    const uri = `/api/getTree?gameAddress=${gameAddress}&chainId=${chainId}&itemId=${itemId}`;

    const data = await fetch(uri);
    const { tree } = await data.json();

    if (!tree) {
      return null;
    }

    const merkleTree = StandardMerkleTree.load(JSON.parse(tree));

    return merkleTree as StandardMerkleTree<WhitelistItemLeaf>;
  } catch (e) {
    return null;
  }
};

export const useWhitelistTree = (
  itemId: string | undefined | null,
): {
  tree: StandardMerkleTree<WhitelistItemLeaf> | null;
  reload: () => void;
  loading: boolean;
  error: Error | null;
} => {
  const { game } = useGame();
  const { id: gameAddress, chainId } = game || {};

  const input: FetcherInput = useMemo(
    () => ({
      gameAddress: gameAddress ? gameAddress.toString() : '',
      chainId: chainId ? chainId.toString() : '',
      itemId: itemId ? itemId.toString() : '',
    }),
    [gameAddress, chainId, itemId],
  );

  const { data, error, mutate, isLoading, isValidating } = useSWR<
    StandardMerkleTree<WhitelistItemLeaf> | null,
    Error,
    FetcherInput
  >(input, fetcher, {
    isPaused: () => !gameAddress || !itemId || !chainId,
  });

  return {
    loading: isLoading || isValidating,
    tree: data || null,
    error: error || null,
    reload: mutate,
  };
};
