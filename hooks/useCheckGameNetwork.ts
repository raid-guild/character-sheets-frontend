import { useCallback, useMemo } from 'react';
import { useChainId } from 'wagmi';

import { useGame } from '@/contexts/GameContext';
import { useToast } from '@/hooks/useToast';

export const useCheckGameNetwork = (): {
  isWrongNetwork: boolean;
  renderNetworkError: () => void;
} => {
  const { game } = useGame();

  const { renderError } = useToast();

  const renderNetworkError = useCallback(() => {
    renderError('You are connected to the wrong network');
  }, [renderError]);

  const connectedChainId = useChainId();

  const isWrongNetwork = useMemo(
    () => connectedChainId !== game?.chainId,
    [connectedChainId, game?.chainId],
  );

  return {
    isWrongNetwork,
    renderNetworkError,
  };
};
