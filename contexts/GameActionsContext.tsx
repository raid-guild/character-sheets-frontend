import { useDisclosure } from '@chakra-ui/react';
import { createContext, useCallback, useContext, useMemo } from 'react';

import { useGame } from '@/contexts/GameContext';
import { useCheckGameNetwork } from '@/hooks/useCheckGameNetwork';

export enum AdminActions {}

export enum GameMasterActions {
  ADD_GAME_MASTER = 'Add a game master',
  UPDATE_GAME_METADATA = 'Update game metadata',
  RESTORE_CHARACTER = 'Restore character',
  CREATE_CLASS = 'Create class',
  CREATE_ITEM = 'Create item',
}

type ModalProps = Omit<ReturnType<typeof useDisclosure>, 'onOpen'> | undefined;

type GameActionsContextType = {
  adminActions: AdminActions[];
  gmActions: GameMasterActions[];

  openActionModal: (action: AdminActions | GameMasterActions) => void;
  addGameMasterModal: ModalProps;
  updateGameMetadataModal: ModalProps;
  restoreCharacterModal: ModalProps;
  createClassModal: ModalProps;
  createItemModal: ModalProps;
};

const GameActionsContext = createContext<GameActionsContextType>({
  adminActions: [],
  gmActions: [],

  openActionModal: () => {},
  addGameMasterModal: undefined,
  updateGameMetadataModal: undefined,
  restoreCharacterModal: undefined,
  createClassModal: undefined,
  createItemModal: undefined,
});

export const useGameActions = (): GameActionsContextType =>
  useContext(GameActionsContext);

export const GameActionsProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { isMaster } = useGame();

  const addGameMasterModal = useDisclosure();
  const updateGameMetadataModal = useDisclosure();
  const restoreCharacterModal = useDisclosure();
  const createClassModal = useDisclosure();
  const createItemModal = useDisclosure();

  const adminActions = useMemo(() => {
    return [];
  }, []);

  const gmActions = useMemo(() => {
    if (isMaster) {
      const actions = Object.keys(GameMasterActions).map(
        key => GameMasterActions[key as keyof typeof GameMasterActions],
      );

      return actions;
    }
    return [];
  }, [isMaster]);

  const { isWrongNetwork, renderNetworkError } = useCheckGameNetwork();

  const openActionModal = useCallback(
    (action: AdminActions | GameMasterActions) => {
      if (isWrongNetwork) {
        renderNetworkError();
        return;
      }
      switch (action) {
        case GameMasterActions.ADD_GAME_MASTER:
          addGameMasterModal.onOpen();
          break;
        case GameMasterActions.UPDATE_GAME_METADATA:
          updateGameMetadataModal.onOpen();
          break;
        case GameMasterActions.RESTORE_CHARACTER:
          restoreCharacterModal.onOpen();
          break;
        case GameMasterActions.CREATE_CLASS:
          createClassModal.onOpen();
          break;
        case GameMasterActions.CREATE_ITEM:
          createItemModal.onOpen();
          break;
        default:
          break;
      }
    },
    [
      addGameMasterModal,
      createClassModal,
      createItemModal,
      isWrongNetwork,
      renderNetworkError,
      updateGameMetadataModal,
      restoreCharacterModal,
    ],
  );

  return (
    <GameActionsContext.Provider
      value={{
        adminActions,
        gmActions,

        openActionModal,
        addGameMasterModal,
        updateGameMetadataModal,
        restoreCharacterModal,
        createClassModal,
        createItemModal,
      }}
    >
      {children}
    </GameActionsContext.Provider>
  );
};
