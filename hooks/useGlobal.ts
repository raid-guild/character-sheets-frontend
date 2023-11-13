import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNetwork } from 'wagmi';

import { GetGlobalDocument, GlobalInfoFragment } from '@/graphql/autogen/types';
import { getGraphClient } from '@/graphql/client';
import { SUPPORTED_CHAINS } from '@/lib/web3';

const fetchGlobalForChainId = async (
  chainId: number,
): Promise<{
  data: GlobalInfoFragment | undefined;
  error: Error | undefined;
  chainId: number;
}> => {
  try {
    const { data, error } = await getGraphClient(chainId).query(
      GetGlobalDocument,
      {},
    );

    return {
      data: data?.globals[0] ?? undefined,
      error,
      chainId,
    };
  } catch (e) {
    console.error('Error fetching global for chainId', chainId, e);
    return {
      data: undefined,
      error: e as Error,
      chainId,
    };
  }
};

export const useGlobal = (): {
  data: Record<number, GlobalInfoFragment | undefined>;
  loading: boolean;
  error: Error | undefined;
  reload: () => void;
} => {
  const [data, setData] = useState<
    Record<number, GlobalInfoFragment | undefined>
  >({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [refreshCount, setRefreshCount] = useState<number>(0);

  const reload = useCallback(() => {
    setRefreshCount(count => count + 1);
  }, []);

  const fetchGlobal = useCallback(async () => {
    setLoading(true);

    const results = await Promise.all(
      SUPPORTED_CHAINS.map(chain => fetchGlobalForChainId(chain.id)),
    );

    const { data: _data, error: _error } = results.reduce(
      (acc, result) => {
        acc.data[result.chainId] = result.data;
        acc.error = acc.error || result.error;
        return acc;
      },
      { data: {}, error: undefined } as {
        data: Record<number, GlobalInfoFragment | undefined>;
        error: Error | undefined;
      },
    );

    setData(_data);
    setError(_error);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchGlobal();
  }, [fetchGlobal, refreshCount]);

  return {
    data,
    loading,
    error,
    reload,
  };
};

export const useGlobalForChain = (): {
  loading: boolean;
  error: Error | undefined;
  reload: () => void;
  data: GlobalInfoFragment | undefined;
} => {
  const { chain } = useNetwork();

  const { data: allData, loading, error, reload } = useGlobal();

  const data = useMemo(() => {
    if (!chain) {
      return undefined;
    }
    return allData[chain.id];
  }, [allData, chain]);

  return {
    data,
    loading,
    error,
    reload,
  };
};
