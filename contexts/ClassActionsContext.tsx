import { useToast } from '@chakra-ui/react';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useAccount } from 'wagmi';

import { useCharacterActions } from '@/contexts/CharacterActionsContext';
import { useGame } from '@/contexts/GameContext';
import { useCheckGameNetwork } from '@/hooks/useCheckGameNetwork';
import { Class } from '@/utils/types';

export enum PlayerActions {
  CLAIM_CLASS = 'Claim class',
  RENOUNCE_CLASS = 'Renounce class',
}

export enum GameMasterActions {
  ASSIGN_CLASS = 'Assign class',
  EDIT_CLASS = 'Edit class',
  REVOKE_CLASS = 'Revoke class',
}

type ClassActionsContextType = {
  playerActions: PlayerActions[];
  gmActions: GameMasterActions[];

  selectedClass: Class | null;
  selectClass: (gamclassEntityeClass: Class | null) => void;

  openActionModal: (action: PlayerActions | GameMasterActions) => void;
};

const ClassActionsContext = createContext<ClassActionsContextType>({
  playerActions: [],
  gmActions: [],

  selectedClass: null,
  selectClass: () => {},

  openActionModal: () => {},
});

export const useClassActions = (): ClassActionsContextType =>
  useContext(ClassActionsContext);

export const ClassActionsProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { address } = useAccount();
  const { character, isMaster } = useGame();
  const {
    assignClassModal,
    claimClassModal,
    renounceClassModal,
    revokeClassModal,
  } = useCharacterActions();
  const toast = useToast();

  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  const playerActions = useMemo(() => {
    if (character?.player !== address?.toLowerCase()) {
      return [];
    }

    let actions = Object.keys(PlayerActions).map(
      key => PlayerActions[key as keyof typeof PlayerActions],
    );

    const classHolderIds = selectedClass?.holders.map(h => h.characterId) ?? [];
    if (classHolderIds.includes(character?.characterId ?? '')) {
      actions = actions.filter(a => a !== PlayerActions.CLAIM_CLASS);
    }

    if (!classHolderIds.includes(character?.characterId ?? '')) {
      actions = actions.filter(a => a !== PlayerActions.RENOUNCE_CLASS);
    }

    return actions;
  }, [address, character, selectedClass]);

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
    (action: PlayerActions | GameMasterActions) => {
      if (isWrongNetwork) {
        renderNetworkError();
        return;
      }
      switch (action) {
        case PlayerActions.CLAIM_CLASS:
          claimClassModal?.onOpen();
          break;
        case PlayerActions.RENOUNCE_CLASS:
          renounceClassModal?.onOpen();
          break;
        case GameMasterActions.ASSIGN_CLASS:
          assignClassModal?.onOpen();
          break;
        case GameMasterActions.EDIT_CLASS:
          toast({
            title: 'Coming soon!',
            position: 'top',
            status: 'warning',
          });
          break;
        case GameMasterActions.REVOKE_CLASS:
          revokeClassModal?.onOpen();
          break;
        default:
          break;
      }
    },
    [
      assignClassModal,
      claimClassModal,
      toast,
      isWrongNetwork,
      renderNetworkError,
      renounceClassModal,
      revokeClassModal,
    ],
  );

  return (
    <ClassActionsContext.Provider
      value={{
        playerActions,
        gmActions,

        selectedClass,
        selectClass: setSelectedClass,

        openActionModal,
      }}
    >
      {children}
    </ClassActionsContext.Provider>
  );
};
