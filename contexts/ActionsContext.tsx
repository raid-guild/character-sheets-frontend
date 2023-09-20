import { useDisclosure } from '@chakra-ui/react';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useAccount } from 'wagmi';

import { useGame } from '@/contexts/GameContext';
import { Character, Item } from '@/utils/types';

export enum PlayerActions {
  EDIT_CHARACTER = 'Edit character',
  EQUIP_ITEM = 'Equip/Unequip item',
  RENOUNCE_CHARACTER = 'Renounce character',
}

export enum GameMasterActions {
  GIVE_ITEMS = 'Give items',
  ASSIGN_CLASS = 'Assign class',
  GIVE_XP = 'Give XP',
}

type ActionsContextType = {
  playerActions: PlayerActions[];
  gmActions: GameMasterActions[];

  selectedCharacter: Character | null;
  selectCharacter: (character: Character) => void;

  selectedItem: Item | null;
  selectItem: (item: Item) => void;

  openActionModal: (action: PlayerActions | GameMasterActions) => void;
  assignClassModal: ReturnType<typeof useDisclosure> | undefined;
  editCharacterModal: ReturnType<typeof useDisclosure> | undefined;
  equipItemModal: ReturnType<typeof useDisclosure> | undefined;
  giveExpModal: ReturnType<typeof useDisclosure> | undefined;
  giveItemsModal: ReturnType<typeof useDisclosure> | undefined;
  renounceCharacterModal: ReturnType<typeof useDisclosure> | undefined;
};

const ActionsContext = createContext<ActionsContextType>({
  playerActions: [],
  gmActions: [],

  selectedCharacter: null,
  selectCharacter: () => {},

  selectedItem: null,
  selectItem: () => {},

  openActionModal: () => {},
  assignClassModal: undefined,
  editCharacterModal: undefined,
  equipItemModal: undefined,
  giveExpModal: undefined,
  giveItemsModal: undefined,
  renounceCharacterModal: undefined,
});

export const useActions = (): ActionsContextType => useContext(ActionsContext);

export const ActionsProvider: React.FC<{
  children: JSX.Element;
}> = ({ children }) => {
  const { address } = useAccount();
  const { game, isMaster } = useGame();

  const assignClassModal = useDisclosure();
  const editCharacterModal = useDisclosure();
  const equipItemModal = useDisclosure();
  const giveExpModal = useDisclosure();
  const giveItemsModal = useDisclosure();
  const renounceCharacterModal = useDisclosure();

  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null,
  );

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

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

  const openActionModal = useCallback(
    (action: PlayerActions | GameMasterActions) => {
      switch (action) {
        case GameMasterActions.GIVE_XP:
          giveExpModal.onOpen();
          break;
        case GameMasterActions.GIVE_ITEMS:
          giveItemsModal.onOpen();
          break;
        case GameMasterActions.ASSIGN_CLASS:
          assignClassModal.onOpen();
          break;
        case PlayerActions.EDIT_CHARACTER:
          editCharacterModal.onOpen();
          break;
        case PlayerActions.EQUIP_ITEM:
          equipItemModal.onOpen();
          break;
        case PlayerActions.RENOUNCE_CHARACTER:
          renounceCharacterModal.onOpen();
        default:
          break;
      }
    },
    [
      assignClassModal,
      editCharacterModal,
      equipItemModal,
      giveExpModal,
      giveItemsModal,
      renounceCharacterModal,
    ],
  );

  return (
    <ActionsContext.Provider
      value={{
        playerActions,
        gmActions,

        selectedCharacter,
        selectCharacter: setSelectedCharacter,

        selectedItem,
        selectItem: setSelectedItem,

        openActionModal,
        assignClassModal,
        editCharacterModal,
        equipItemModal,
        giveExpModal,
        giveItemsModal,
        renounceCharacterModal,
      }}
    >
      {children}
    </ActionsContext.Provider>
  );
};
