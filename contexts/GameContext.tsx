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
  isAdmin: boolean;
  isMaster: boolean;
  isEligibleForCharacter: boolean;
  loading: boolean;
  error: CombinedError | undefined;
  reload: () => void;
};

const GameContext = createContext<GameContextType>({
  game: null,
  character: null,
  isAdmin: false,
  isMaster: false,
  isEligibleForCharacter: false,
  loading: false,
  error: undefined,
  reload: () => {},
});

export const useGame = (): GameContextType => useContext(GameContext);

export const GameProvider: React.FC<
  React.PropsWithChildren<{
    chainId: number;
    gameId: string;
    game: Game | null;
  }>
> = ({ chainId, children, gameId, game }) => {
  const client = useMemo(() => getGraphClient(chainId), [chainId]);

  return (
    <Provider value={client}>
      <GameProviderInner
        gameId={gameId}
        game={game}
      >
        {children}
      </GameProviderInner>
    </Provider>
  );
};

const GameProviderInner: React.FC<
  React.PropsWithChildren<{
    gameId: string;
    game: Game | null;
  }>
> = ({ children, gameId, game: staticGame }) => {
  const { address } = useAccount();

  const [game, setGame] = useState<Game | null>(staticGame);
  const [isFormatting, setIsFormatting] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);

  const queryVariables = useMemo(
    () => ({
      gameId: gameId.toLowerCase(),
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

  const isAdmin = useMemo(
    () => game?.admins.includes(address?.toLowerCase() ?? '') ?? false,
    [game, address],
  );

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
        isAdmin,
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
