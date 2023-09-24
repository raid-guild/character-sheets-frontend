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
  REVOKE_CLASS = 'Revoke class',
}

export enum GameMasterActions {
  GIVE_ITEMS = 'Give items',
  ASSIGN_CLASS = 'Assign class',
  JAIL_PLAYER = 'Jail player',
  FREE_PLAYER = 'Free player',
  GIVE_XP = 'Give XP',
  REVOKE_CLASS = 'Revoke class',
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
  jailPlayerModal: ReturnType<typeof useDisclosure> | undefined;
  renounceCharacterModal: ReturnType<typeof useDisclosure> | undefined;
  revokeClassModal: ReturnType<typeof useDisclosure> | undefined;
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
  jailPlayerModal: undefined,
  renounceCharacterModal: undefined,
  revokeClassModal: undefined,
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
  const jailPlayerModal = useDisclosure();
  const renounceCharacterModal = useDisclosure();
  const revokeClassModal = useDisclosure();

  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null,
  );

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const playerActions = useMemo(() => {
    if (selectedCharacter?.player !== address?.toLowerCase()) {
      return [];
    }

    let actions = Object.keys(PlayerActions).map(
      key => PlayerActions[key as keyof typeof PlayerActions],
    );
    if (selectedCharacter?.classes.length === 0) {
      actions = actions.filter(a => a !== PlayerActions.REVOKE_CLASS);
    }
    return actions;
  }, [address, selectedCharacter]);

  const gmActions = useMemo(() => {
    if (isMaster) {
      let actions = Object.keys(GameMasterActions).map(
        key => GameMasterActions[key as keyof typeof GameMasterActions],
      );

      if (game?.classes.length === 0) {
        actions = actions.filter(a => a == GameMasterActions.ASSIGN_CLASS);
      }

      if (selectedCharacter?.classes.length === 0) {
        actions = actions.filter(a => a !== GameMasterActions.REVOKE_CLASS);
      }

      if (selectedCharacter?.player === address?.toLowerCase()) {
        actions = actions.filter(a => a !== GameMasterActions.REVOKE_CLASS);
      }

      if (selectedCharacter?.jailed) {
        actions = actions.filter(a => a !== GameMasterActions.JAIL_PLAYER);
      } else {
        actions = actions.filter(a => a !== GameMasterActions.FREE_PLAYER);
      }

      return actions;
    }
    return [];
  }, [address, game, isMaster, selectedCharacter]);

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
        case GameMasterActions.JAIL_PLAYER:
          jailPlayerModal.onOpen();
          break;
        case GameMasterActions.FREE_PLAYER:
          jailPlayerModal.onOpen();
          break;
        case PlayerActions.EDIT_CHARACTER:
          editCharacterModal.onOpen();
          break;
        case PlayerActions.EQUIP_ITEM:
          equipItemModal.onOpen();
          break;
        case PlayerActions.RENOUNCE_CHARACTER:
          renounceCharacterModal.onOpen();
          break;
        case PlayerActions.REVOKE_CLASS:
          revokeClassModal.onOpen();
          break;
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
      jailPlayerModal,
      renounceCharacterModal,
      revokeClassModal,
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
        jailPlayerModal,
        renounceCharacterModal,
        revokeClassModal,
      }}
    >
      {children}
    </ActionsContext.Provider>
  );
};
