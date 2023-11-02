import { useCallback } from 'react';
import useSWR from 'swr';
import { usePublicClient } from 'wagmi';

import { zeroAddress } from 'viem';
import { mainnetReadClient } from '@/lib/web3';

export const useEnsName = (
  address: `0x${string}` | null | undefined,
): {
  ensName: string | undefined;
  reload: () => void;
  loading: boolean;
} => {
  const publicClient = usePublicClient();

  const fetchEnsName = useCallback(
    async (
      addr: `0x${string}` | undefined | null,
    ): Promise<string | undefined> => {
      if (!publicClient || addr === zeroAddress || !addr) return undefined;

      try {
        const name = await mainnetReadClient.getEnsName({
          address: addr,
        });
        return name || undefined;
      } catch (error) {
        console.error('Error fetching ensName', error);
        return undefined;
      }
    },
    [publicClient],
  );

  const { data: ensName, isLoading, mutate } = useSWR(address, fetchEnsName);

  return {
    ensName: ensName || undefined,
    reload: mutate,
    loading: isLoading,
  };
};
