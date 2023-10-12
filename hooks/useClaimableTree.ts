import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { useMemo } from 'react';
import useSWR from 'swr';
import { zeroAddress } from 'viem';

export type ClaimableItemLeaf = [bigint, `0x${string}`, bigint];

type FetcherInput = [`0x${string}`, bigint];

const fetcher = async ([
  _gameAddress,
  _itemId,
]: FetcherInput): Promise<StandardMerkleTree<ClaimableItemLeaf> | null> => {
  const uri = `/api/getTree?gameAddress=${_gameAddress}&itemId=${_itemId.toString()}`;

  const data = await fetch(uri);

  const { tree } = await data.json();

  if (!tree) {
    return null;
  }

  const merkleTree = StandardMerkleTree.load(JSON.parse(tree));

  return merkleTree as StandardMerkleTree<ClaimableItemLeaf>;
};

export const useClaimableTree = (
  gameAddress: `0x${string}`,
  itemId: bigint,
): {
  tree: StandardMerkleTree<ClaimableItemLeaf> | null;
  reload: () => void;
  loading: boolean;
  error: Error | null;
} => {
  const input: FetcherInput = useMemo(
    () => [gameAddress, itemId],
    [gameAddress, itemId],
  );

  const { data, error, mutate, isLoading, isValidating } = useSWR<
    StandardMerkleTree<ClaimableItemLeaf> | null,
    Error,
    FetcherInput
  >(input, fetcher, {
    isPaused: () => !gameAddress || !itemId || gameAddress === zeroAddress,
  });

  return {
    loading: isLoading || isValidating,
    tree: data || null,
    error: error || null,
    reload: mutate,
  };
};
