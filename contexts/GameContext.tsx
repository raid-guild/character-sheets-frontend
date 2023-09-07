import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { CombinedError } from 'urql';
import { useAccount } from 'wagmi';

import { useGetGameQuery } from '@/graphql/autogen/types';
import { formatGame } from '@/utils/helpers';
import { Character, Game } from '@/utils/types';

type GameContextType = {
  game: Game | null;
  character: Character | null;
  loading: boolean;
  error: CombinedError | undefined;
  reload: () => void;
};

const GameContext = createContext<GameContextType>({
  game: null,
  character: null,
  loading: false,
  error: undefined,
  reload: () => {},
});

export const useGame = (): GameContextType => useContext(GameContext);

export const GameProvider: React.FC<{
  children: JSX.Element;
  gameId?: string | null | undefined | string[];
}> = ({ children, gameId }) => {
  const { address } = useAccount();
  const [game, setGame] = useState<Game | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [isFormatting, setIsFormatting] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);

  const queryVariables = useMemo(
    () => ({
      gameId: gameId?.toString().toLowerCase() ?? '',
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
      const formattedGame = await formatGame(data?.game);
      setGame(formattedGame);
      const c = formattedGame?.characters.find(
        c => c.player.toLowerCase() === address?.toLowerCase(),
      );
      setCharacter(c ?? null);
    } else {
      setGame(null);
      setCharacter(null);
    }
    setIsFormatting(false);
    setIsRefetching(false);
  }, [data, address]);

  const refetch = useCallback(async () => {
    setIsRefetching(true);
    reload();
  }, [reload]);

  useEffect(() => {
    if (data?.game) {
      formatGameData();
    }
  }, [data, formatGameData]);

  return (
    <GameContext.Provider
      value={{
        game,
        character,
        loading: fetching || isFormatting || isRefetching,
        error,
        reload: refetch,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
