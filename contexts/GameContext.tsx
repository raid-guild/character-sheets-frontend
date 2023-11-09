import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { CombinedError, Provider } from 'urql';
import { useAccount } from 'wagmi';

import { useGetGameQuery } from '@/graphql/autogen/types';
import { getGraphClient } from '@/graphql/client';
import { useIsEligible } from '@/hooks/useIsEligible';
import { formatGame } from '@/utils/helpers';
import { Character, Game } from '@/utils/types';

type GameContextType = {
  game: Game | null;
  character: Character | null;
  pageCharacter: Character | null;
  isMaster: boolean;
  isEligibleForCharacter: boolean;
  loading: boolean;
  error: CombinedError | undefined;
  reload: () => void;
};

const GameContext = createContext<GameContextType>({
  game: null,
  character: null,
  pageCharacter: null,
  isMaster: false,
  isEligibleForCharacter: false,
  loading: false,
  error: undefined,
  reload: () => {},
});

export const useGame = (): GameContextType => useContext(GameContext);

export const GameProvider: React.FC<{
  chainId: number;
  children: JSX.Element;
  gameId: string;
  characterId?: string | null | undefined | string[];
}> = ({ chainId, children, gameId, characterId }) => {
  const client = useMemo(() => getGraphClient(chainId), [chainId]);

  return (
    <Provider value={client}>
      <GameProviderInner gameId={gameId} characterId={characterId}>
        {children}
      </GameProviderInner>
    </Provider>
  );
};

const GameProviderInner: React.FC<{
  children: JSX.Element;
  gameId: string;
  characterId?: string | null | undefined | string[];
}> = ({ children, gameId, characterId }) => {
  const { address } = useAccount();

  const [game, setGame] = useState<Game | null>(null);
  const [isFormatting, setIsFormatting] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);

  const queryVariables = useMemo(
    () => ({
      gameId: gameId.toString().toLowerCase(),
    }),
    [gameId],
  );

  const [{ data, fetching, error }, reload] = useGetGameQuery({
    requestPolicy: 'cache-and-network',
    variables: queryVariables,
  });

  const formatGameData = useCallback(async () => {
    setIsFormatting(true);
    if (data?.game) {
      const formattedGame = await formatGame(data.game);
      setGame(formattedGame);
    } else {
      setGame(null);
    }
    setIsFormatting(false);
    setIsRefetching(false);
  }, [data]);

  const refetch = useCallback(async () => {
    setIsRefetching(true);
    reload();
  }, [reload]);

  useEffect(() => {
    if (data?.game) {
      formatGameData();
    }
  }, [data, formatGameData]);

  const character = useMemo(() => {
    if (!game || !address) return null;
    return (
      game.characters.find(c => c.player === address.toLowerCase()) ?? null
    );
  }, [game, address]);

  const pageCharacter = useMemo(() => {
    if (!characterId || typeof characterId !== 'string') return null;
    return (
      game?.characters.find(c => c.id === characterId.toLowerCase()) ?? null
    );
  }, [game, characterId]);

  const isMaster = useMemo(
    () => game?.masters.includes(address?.toLowerCase() ?? '') ?? false,
    [game, address],
  );

  const { isEligible: isEligibleForCharacter } = useIsEligible(game, address);

  return (
    <GameContext.Provider
      value={{
        game,
        character,
        pageCharacter,
        isMaster,
        isEligibleForCharacter,
        loading: fetching || isFormatting || isRefetching,
        error,
        reload: refetch,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
