import { CombinedError } from 'urql';

import { useGetGlobalQuery } from '@/graphql/autogen/types';

export const useGlobal = (
  networkName: string,
): {
  gameFactory: string | undefined;
  loading: boolean;
  error: CombinedError | undefined;
  reload: () => void;
} => {
  const [{ data, fetching, error }, reload] = useGetGlobalQuery({
    variables: {
      id: networkName,
    },
  });

  return {
    gameFactory: data?.global?.gameFactory ?? undefined,
    loading: fetching,
    error,
    reload,
  };
};
