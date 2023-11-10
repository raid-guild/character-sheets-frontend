import { useCallback, useMemo } from 'react';
import { useChainId } from 'wagmi';

import { useGame } from '@/contexts/GameContext';
import { useToast } from '@/hooks/useToast';
import { getChainLabelFromId } from '@/lib/web3';

export const useCheckGameNetwork = (): {
  isWrongNetwork: boolean;
  renderNetworkError: () => void;
} => {
  const { game } = useGame();

  const { renderError } = useToast();

  const renderNetworkError = useCallback(() => {
    renderError(
      `Please switch your wallet to ${getChainLabelFromId(
        game?.chainId ?? 0,
      )}.`,
    );
  }, [renderError, game?.chainId]);

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
