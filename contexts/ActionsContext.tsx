import { useDisclosure } from '@chakra-ui/react';
import { createContext, useContext, useMemo, useState } from 'react';

import { useGame } from '@/contexts/GameContext';
import { Character } from '@/utils/types';

enum PlayerActions {
  EDIT = 'Edit',
}

enum GameMasterActions {
  GIVE_XP = 'Give XP',
}

type ActionsContextType = {
  playerActions: PlayerActions[];
  gmActions: GameMasterActions[];

  character: Character | null;
  setCharacter: (character: Character) => void;

  openActionModal: (action: PlayerActions | GameMasterActions) => void;
  editModal: ReturnType<typeof useDisclosure> | undefined;
  giveExpModal: ReturnType<typeof useDisclosure> | undefined;
};

const ActionsContext = createContext<ActionsContextType>({
  playerActions: [],
  gmActions: [],

  character: null,
  setCharacter: () => {},

  openActionModal: () => {},
  editModal: undefined,
  giveExpModal: undefined,
});

export const useActions = (): ActionsContextType => useContext(ActionsContext);

export const ActionsProvider: React.FC<{
  children: JSX.Element;
}> = ({ children }) => {
  const { isMaster } = useGame();

  const editModal = useDisclosure();

  const giveExpModal = useDisclosure();

  const [character, setCharacter] = useState<Character | null>(null);

  const playerActions = useMemo(() => {
    return Object.keys(PlayerActions).map(
      key => PlayerActions[key as keyof typeof PlayerActions],
    );
  }, []);

  const gmActions = useMemo(() => {
    if (isMaster) {
      return Object.keys(GameMasterActions).map(
        key => GameMasterActions[key as keyof typeof GameMasterActions],
      );
    }
    return [];
  }, [isMaster]);

  const openActionModal = (action: PlayerActions | GameMasterActions) => {
    switch (action) {
      case PlayerActions.EDIT:
        editModal.onOpen();
        break;
      case GameMasterActions.GIVE_XP:
        giveExpModal.onOpen();
        break;
      default:
        break;
    }
  };

  return (
    <ActionsContext.Provider
      value={{
        playerActions,
        gmActions,

        character,
        setCharacter: (character: Character) => setCharacter(character),

        openActionModal,
        editModal,
        giveExpModal,
      }}
    >
      {children}
    </ActionsContext.Provider>
  );
};
