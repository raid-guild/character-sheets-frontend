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

  editNameModal: ReturnType<typeof useDisclosure> | undefined;

  assignClassModal: ReturnType<typeof useDisclosure> | undefined;
  giveExpModal: ReturnType<typeof useDisclosure> | undefined;
};

const ActionsContext = createContext<ActionsContextType>({
  playerActions: [],
  gmActions: [],

  selectedCharacter: null,
  selectCharacter: () => {},

  openActionModal: () => {},

  editNameModal: undefined,

  assignClassModal: undefined,
  giveExpModal: undefined,
});

export const useActions = (): ActionsContextType => useContext(ActionsContext);

export const ActionsProvider: React.FC<{
  children: JSX.Element;
}> = ({ children }) => {
  const { address } = useAccount();
  const { isMaster } = useGame();

  const editNameModal = useDisclosure();

  const assignClassModal = useDisclosure();
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
      return Object.keys(GameMasterActions).map(
        key => GameMasterActions[key as keyof typeof GameMasterActions],
      );
    }
    return [];
  }, [isMaster]);

  const openActionModal = (action: PlayerActions | GameMasterActions) => {
    switch (action) {
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

        editNameModal,

        assignClassModal,
        giveExpModal,
      }}
    >
      {children}
    </ActionsContext.Provider>
  );
};
