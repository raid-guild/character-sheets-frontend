import { useCallback } from 'react';
import useSWR from 'swr';
import { zeroAddress } from 'viem';

import { READ_CLIENTS } from '@/lib/web3';

export const useEnsName = (
  address: `0x${string}` | null | undefined,
): {
  ensName: string | undefined;
  reload: () => void;
  loading: boolean;
} => {
  const fetchEnsName = useCallback(
    async (
      addr: `0x${string}` | undefined | null,
    ): Promise<string | undefined> => {
      if (addr === zeroAddress || !addr) return undefined;

      try {
        const mainnetReadClient = READ_CLIENTS[1];
        if (!mainnetReadClient) return undefined;
        const name = await mainnetReadClient.getEnsName({
          address: addr,
        });
        return name || undefined;
      } catch (error) {
        console.error('Error fetching ensName', error);
        return undefined;
      }
    },
    [],
  );

  const { data: ensName, isLoading, mutate } = useSWR(address, fetchEnsName);

  return {
    ensName: ensName || undefined,
    reload: mutate,
    loading: isLoading,
  };
};
