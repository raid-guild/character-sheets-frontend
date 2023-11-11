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
import { useIsEligible } from '@/hooks/useIsEligible';
import { formatGame } from '@/utils/helpers';
import { Character, Game } from '@/utils/types';

type GameContextType = {
  game: Game | null;
  character: Character | null;
  pageCharacter: Character | null;
  isOwner: boolean;
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
  pageCharacter: null,
  isOwner: false,
  isAdmin: false,
  isMaster: false,
  isEligibleForCharacter: false,
  loading: false,
  error: undefined,
  reload: () => {},
});

export const useGame = (): GameContextType => useContext(GameContext);

export const GameProvider: React.FC<{
  children: JSX.Element;
  gameId?: string | null | undefined | string[];
  characterId?: string | null | undefined | string[];
}> = ({ children, gameId, characterId }) => {
  const { address } = useAccount();

  const [game, setGame] = useState<Game | null>(null);
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

  const isOwner = useMemo(
    () => game?.owner === address?.toLowerCase() ?? false,
    [game, address],
  );

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
        pageCharacter,
        isOwner,
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
