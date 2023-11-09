import { useCallback, useEffect, useState } from 'react';

import { getAllSubgraphHealthStatus, SubgraphHealth } from '@/graphql/health';

type GraphHealth = Record<number, SubgraphHealth>;

export const useGraphHealth = (): GraphHealth => {
  const [graphHealth, setGraphHealth] = useState<GraphHealth>({});

  const updateGraphHealth = useCallback(
    () => setGraphHealth(getAllSubgraphHealthStatus()),
    [],
  );

  useEffect(() => {
    const interval = setInterval(updateGraphHealth, 2000);
    return () => clearInterval(interval);
  }, [updateGraphHealth]);

  return graphHealth;
};
