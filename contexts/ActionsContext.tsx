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
import { Character, Class } from '@/utils/types';

enum PermissionTypes {
  PLAYER = 'player',
  GAME_MASTER = 'game_master',
}

enum ActionNames {
  EDIT_NAME = 'Edit name',
  ASSIGN_CLASS = 'Assign class',
  GIVE_XP = 'Give XP',
}

export enum CardTypes {
  CHARACTER = 'character',
  CLASS = 'class',
}

type Action = {
  name: ActionNames;
  permission: PermissionTypes;
  allowedCards: CardTypes[];
};

const ACTIONS: Action[] = [
  {
    name: ActionNames.EDIT_NAME,
    permission: PermissionTypes.PLAYER,
    allowedCards: [CardTypes.CHARACTER],
  },
  {
    name: ActionNames.ASSIGN_CLASS,
    permission: PermissionTypes.GAME_MASTER,
    allowedCards: [CardTypes.CHARACTER, CardTypes.CLASS],
  },
  {
    name: ActionNames.GIVE_XP,
    permission: PermissionTypes.GAME_MASTER,
    allowedCards: [CardTypes.CHARACTER],
  },
];

type ActionsContextType = {
  playerActions: ActionNames[];
  gmActions: ActionNames[];

  selectEntity: (type: CardTypes, entity: Character | Class) => void;
  cardType: CardTypes;
  selectedCharacter: Character | null;
  selectedClass: Class | null;

  openActionModal: (action: ActionNames) => void;
  assignClassModal: ReturnType<typeof useDisclosure> | undefined;
  editNameModal: ReturnType<typeof useDisclosure> | undefined;
  giveExpModal: ReturnType<typeof useDisclosure> | undefined;
};

const ActionsContext = createContext<ActionsContextType>({
  playerActions: [],
  gmActions: [],

  selectEntity: () => {},
  cardType: CardTypes.CHARACTER,
  selectedCharacter: null,
  selectedClass: null,

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
  const { isMaster } = useGame();

  const assignClassModal = useDisclosure();
  const editNameModal = useDisclosure();
  const giveExpModal = useDisclosure();

  const [cardType, setCardType] = useState<CardTypes>(CardTypes.CHARACTER);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null,
  );
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  const playerActions = useMemo(() => {
    if (selectedCharacter?.player !== address?.toLowerCase()) {
      return [];
    }
    return ACTIONS.filter(
      action =>
        action.permission === PermissionTypes.PLAYER &&
        action.allowedCards.includes(cardType),
    ).map(action => action.name);
  }, [address, cardType, selectedCharacter]);

  const gmActions = useMemo(() => {
    if (!isMaster) return [];

    return ACTIONS.filter(action => action.allowedCards.includes(cardType))
      .filter(action => action.permission === PermissionTypes.GAME_MASTER)
      .map(action => action.name);
  }, [cardType, isMaster]);

  const selectEntity = useCallback(
    (type: CardTypes, entity: Character | Class) => {
      setCardType(type);
      switch (type) {
        case CardTypes.CHARACTER:
          setSelectedCharacter(entity as Character);
          setSelectedClass(null);
          break;
        case CardTypes.CLASS:
          setSelectedClass(entity as Class);
          setSelectedCharacter(null);
          break;
        default:
          break;
      }
    },
    [],
  );

  const openActionModal = useCallback(
    (action: ActionNames) => {
      switch (action) {
        case ActionNames.ASSIGN_CLASS:
          if (cardType === CardTypes.CHARACTER) {
            assignClassModal.onOpen();
          }
          break;
        case ActionNames.EDIT_NAME:
          editNameModal.onOpen();
          break;
        case ActionNames.GIVE_XP:
          giveExpModal.onOpen();
          break;
        default:
          break;
      }
    },
    [assignClassModal, cardType, editNameModal, giveExpModal],
  );

  return (
    <ActionsContext.Provider
      value={{
        playerActions,
        gmActions,

        selectEntity,
        cardType,
        selectedCharacter,
        selectedClass,

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
