import { SubgraphHealth, getAllSubgraphHealthStatus } from '@/graphql/health';
import { useCallback, useEffect, useState } from 'react';

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
