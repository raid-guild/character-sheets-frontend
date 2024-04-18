import { useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { usePublicClient } from 'wagmi';

import { parseAbi, zeroAddress } from 'viem';

type QueryKey = [
  `0x${string}` | null | undefined,
  `0x${string}` | null | undefined,
  `0x${string}` | null | undefined,
];

export const useIsApprovedForAll = (
  erc1155Address: `0x${string}` | null | undefined,
  owner: `0x${string}` | null | undefined,
  spender: `0x${string}` | null | undefined,
): {
  isApprovedForAll: boolean;
  reload: () => void;
  loading: boolean;
} => {
  const publicClient = usePublicClient();

  const fetchEligible = useCallback(
    async ([
      tokenAddress,
      ownerAddress,
      spenderAddress,
    ]: QueryKey): Promise<boolean> => {
      if (!publicClient || !tokenAddress || !ownerAddress || !spenderAddress)
        return false;
      if (
        tokenAddress === zeroAddress ||
        ownerAddress === zeroAddress ||
        spenderAddress === zeroAddress
      )
        return false;

      try {
        const approved = (await publicClient.readContract({
          address: tokenAddress,
          abi: parseAbi([
            'function isApprovedForAll(address,address) view returns (bool)',
          ]),
          functionName: 'isApprovedForAll',
          args: [ownerAddress, spenderAddress],
        })) as boolean;
        return approved;
      } catch (error) {
        console.error('Error fetching eligibility: ', error);
        return false;
      }
    },
    [publicClient],
  );

  const queryKeys: QueryKey = [erc1155Address, owner, spender];

  const {
    data: isApprovedForAll,
    isLoading,
    mutate,
  } = useSWR(queryKeys, fetchEligible);

  return {
    isApprovedForAll: isApprovedForAll || false,
    reload: mutate,
    loading: isLoading,
  };
};
