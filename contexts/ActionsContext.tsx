import { useDisclosure } from '@chakra-ui/react';
import { createContext, useContext, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';

import { useGame } from '@/contexts/GameContext';
import { Character } from '@/utils/types';

enum PlayerActions {
  EDIT_NAME = 'Edit name',
}

enum GameMasterActions {
  ASSIGN_CLASS = 'Assign class',
  GIVE_XP = 'Give XP',
}

type ActionsContextType = {
  playerActions: PlayerActions[];
  gmActions: GameMasterActions[];

  selectedCharacter: Character | null;
  selectCharacter: (character: Character) => void;

  openActionModal: (action: PlayerActions | GameMasterActions) => void;
  assignClassModal: ReturnType<typeof useDisclosure> | undefined;
  editNameModal: ReturnType<typeof useDisclosure> | undefined;
  giveExpModal: ReturnType<typeof useDisclosure> | undefined;
};

const ActionsContext = createContext<ActionsContextType>({
  playerActions: [],
  gmActions: [],

  selectedCharacter: null,
  selectCharacter: () => {},

  openActionModal: () => {},
  assignClassModal: undefined,
  editNameModal: undefined,
  giveExpModal: undefined,
});

export const useActions = (): ActionsContextType => useContext(ActionsContext);

export const ActionsProvider: React.FC<{
  children: JSX.Element;
}> = ({ children }) => {
  const { address } = useAccount();
  const { game, isMaster } = useGame();

  const assignClassModal = useDisclosure();
  const editNameModal = useDisclosure();
  const giveExpModal = useDisclosure();

  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null,
  );

  const playerActions = useMemo(() => {
    if (selectedCharacter?.player !== address?.toLowerCase()) {
      return [];
    }
    return Object.keys(PlayerActions).map(
      key => PlayerActions[key as keyof typeof PlayerActions],
    );
  }, [address, selectedCharacter]);

  const gmActions = useMemo(() => {
    if (isMaster) {
      if (game?.classes.length === 0) {
        return Object.keys(GameMasterActions)
          .map(key => GameMasterActions[key as keyof typeof GameMasterActions])
          .filter(action => action !== GameMasterActions.ASSIGN_CLASS);
      }

      return Object.keys(GameMasterActions).map(
        key => GameMasterActions[key as keyof typeof GameMasterActions],
      );
    }
    return [];
  }, [game, isMaster]);

  const openActionModal = (action: PlayerActions | GameMasterActions) => {
    switch (action) {
      case GameMasterActions.ASSIGN_CLASS:
        assignClassModal.onOpen();
        break;
      case PlayerActions.EDIT_NAME:
        editNameModal.onOpen();
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

        selectedCharacter,
        selectCharacter: (character: Character) =>
          setSelectedCharacter(character),

        openActionModal,
        assignClassModal,
        editNameModal,
        giveExpModal,
      }}
    >
      {children}
    </ActionsContext.Provider>
  );
};
