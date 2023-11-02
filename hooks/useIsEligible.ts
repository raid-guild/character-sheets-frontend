import { useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { usePublicClient } from 'wagmi';

import { Game } from '@/utils/types';
import { zeroAddress } from 'viem';

export const useIsEligible = (
  game: Game | null | undefined,
  address: `0x${string}` | null | undefined,
): {
  isEligible: boolean;
  reload: () => void;
  loading: boolean;
} => {
  const publicClient = usePublicClient();

  const fetchEligible = useCallback(
    async ([adaptor, addr]: [
      `0x${string}` | null,
      `0x${string}`,
    ]): Promise<boolean> => {
      if (!publicClient || adaptor === null || addr === zeroAddress)
        return false;
      if (adaptor === zeroAddress) return true;

      try {
        const eligible = (await publicClient.readContract({
          address: adaptor,
          abi: ['function isEligible(address) view returns (bool)'],
          functionName: 'isEligible',
          args: [addr],
        })) as boolean;
        return eligible;
      } catch (error) {
        console.error('Error fetching eligibility: ', error);
        return false;
      }
    },
    [publicClient],
  );

  const queryKeys: [`0x${string}` | null, `0x${string}`] = useMemo(() => {
    if (!address || !game) return [null, zeroAddress];
    return [game.characterEligibilityAdaptor as `0x${string}`, address];
  }, [address, game]);

  const {
    data: isEligible,
    isLoading,
    mutate,
  } = useSWR(queryKeys, fetchEligible);

  return {
    isEligible: isEligible || false,
    reload: mutate,
    loading: isLoading,
  };
};
