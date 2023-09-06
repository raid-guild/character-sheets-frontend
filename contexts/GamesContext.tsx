import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { CombinedError } from 'urql';
import { useAccount } from 'wagmi';

import { GameInfoFragment, useGetGamesQuery } from '@/graphql/autogen/types';
import { uriToHttp } from '@/utils/helpers';
import { Game, Metadata } from '@/utils/types';

const fetchMetadata = async (uri: string): Promise<Metadata> => {
  const res = await fetch(`${uri}`);
  return await res.json();
};

export const formatGame = async (game: GameInfoFragment): Promise<Game> => {
  const metadata = await fetchMetadata(uriToHttp(game.uri)[0]);

  return {
    id: game.id,
    uri: game.uri,
    owners: game.owners,
    masters: game.masters,
    name: metadata.name,
    description: metadata.description,
    image: metadata.image,
    characters: game.characters,
    classes: game.classes,
    items: game.items,
  };
};

type GamesContextType = {
  allGames: Game[] | null;
  myGames: Game[] | null;
  loading: boolean;
  error: CombinedError | undefined;
  reload: () => void;
};

const GamesContext = createContext<GamesContextType>({
  allGames: null,
  myGames: null,
  loading: false,
  error: undefined,
  reload: () => {},
});

export const useGamesContext = (): GamesContextType => useContext(GamesContext);

export const GamesProvider: React.FC<{
  children: JSX.Element;
}> = ({ children }) => {
  const { address } = useAccount();
  const [allGames, setAllGames] = useState<Game[] | null>(null);
  const [myGames, setMyGames] = useState<Game[] | null>(null);
  const [isFormatting, setIsFormatting] = useState(false);

  const [{ data, fetching, error }, reload] = useGetGamesQuery({
    variables: {
      limit: 100,
      skip: 0,
    },
  });

  const formatGames = useCallback(async () => {
    setIsFormatting(true);
    const formattedGames = await Promise.all(
      data?.games.map(g => formatGame(g)) ?? [],
    );
    if (address) {
      const gamesByMaster = formattedGames.filter(g =>
        g.masters.includes(address),
      );
      setMyGames(gamesByMaster);
    }
    setAllGames(formattedGames);
    setIsFormatting(false);
  }, [address, data]);

  useEffect(() => {
    if (data?.games) {
      formatGames();
    }
  }, [data, formatGames]);

  return (
    <GamesContext.Provider
      value={{
        allGames,
        myGames,
        loading: fetching || isFormatting,
        error,
        reload,
      }}
    >
      {children}
    </GamesContext.Provider>
  );
};
