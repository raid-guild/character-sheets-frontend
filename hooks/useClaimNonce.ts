import { useCallback, useMemo } from 'react';
import { Address, parseAbi } from 'viem';
import { usePublicClient } from 'wagmi';

import { useGame } from '@/contexts/GameContext';
import useSWR from 'swr';

export type WhitelistItemLeaf = [bigint, `0x${string}`, bigint, bigint]; // itemId, address, nonce, amount

type FetcherInput = {
  itemsAddress: string;
  character: string;
  itemId: string;
};

export const getClaimNonce = async (
  publicClient: ReturnType<typeof usePublicClient>,
  itemsAddress: Address,
  itemId: bigint,
  account: Address,
) => {
  if (!publicClient) {
    throw new Error('Could not find a public client');
  }
  if (!itemsAddress || !account || !itemId) {
    throw new Error('Missing required input');
  }

  const nonce = (await publicClient.readContract({
    address: itemsAddress,
    abi: parseAbi([
      'function getClaimNonce(uint256 itemId, address character) public view returns (uint256)',
    ]),
    functionName: 'getClaimNonce',
    args: [itemId, account],
  })) as bigint;

  return nonce;
};

export const useClaimNonce = (
  itemId: string | undefined | null,
): {
  nonce: bigint | null;
  reload: () => void;
  loading: boolean;
  error: Error | null;
} => {
  const { game, character } = useGame();
  const { itemsAddress } = game || {};

  const input: FetcherInput = useMemo(
    () => ({
      itemsAddress: itemsAddress ? itemsAddress.toString() : '',
      itemId: itemId ? itemId.toString() : '',
      character: character ? character.account.toString() : '',
    }),
    [itemsAddress, itemId, character],
  );

  const publicClient = usePublicClient();

  const fetcher = useCallback(
    async (_input: FetcherInput) => {
      try {
        const nonce = await getClaimNonce(
          publicClient,
          _input.itemsAddress as Address,
          BigInt(_input.itemId),
          _input.character as Address,
        );

        return nonce;
      } catch (e) {
        return null;
      }
    },
    [publicClient],
  );

  const { data, error, mutate, isLoading, isValidating } = useSWR<
    bigint | null,
    Error,
    FetcherInput
  >(input, fetcher, {
    isPaused: () => !itemsAddress || !itemId || !character || !publicClient,
  });

  return {
    loading: isLoading || isValidating,
    nonce: data || null,
    error: error || null,
    reload: mutate,
  };
};
