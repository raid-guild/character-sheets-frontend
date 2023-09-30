import { useDisclosure, useToast } from '@chakra-ui/react';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useAccount } from 'wagmi';

import { useGame } from '@/contexts/GameContext';
import { Item } from '@/utils/types';

export enum PlayerActions {
  CLAIM_ITEM = 'Claim item',
}

export enum GameMasterActions {
  EDIT_ITEM = 'Edit item',
  GIVE_ITEM = 'Give item',
}

type ItemActionsContextType = {
  playerActions: PlayerActions[];
  gmActions: GameMasterActions[];

  selectedItem: Item | null;
  selectItem: (item: Item) => void;

  openActionModal: (action: PlayerActions | GameMasterActions) => void;
};

const ItemActionsContext = createContext<ItemActionsContextType>({
  playerActions: [],
  gmActions: [],

  selectedItem: null,
  selectItem: () => {},

  openActionModal: () => {},
});

export const useActions = (): ItemActionsContextType =>
  useContext(ItemActionsContext);

export const ItemActionsProvider: React.FC<{
  children: JSX.Element;
}> = ({ children }) => {
  const { address } = useAccount();
  const { character, isMaster } = useGame();
  const toast = useToast();

  const claimItemModal = useDisclosure();

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const playerActions = useMemo(() => {
    if (character?.player !== address?.toLowerCase()) {
      return [];
    }

    return Object.keys(PlayerActions).map(
      key => PlayerActions[key as keyof typeof PlayerActions],
    );
  }, [address, character]);

  const gmActions = useMemo(() => {
    if (isMaster) {
      return Object.keys(GameMasterActions).map(
        key => GameMasterActions[key as keyof typeof GameMasterActions],
      );
    }
    return [];
  }, [isMaster]);

  const openActionModal = useCallback(
    (action: PlayerActions | GameMasterActions) => {
      switch (action) {
        case PlayerActions.CLAIM_ITEM:
          claimItemModal.onOpen();
          break;
        case GameMasterActions.EDIT_ITEM:
          toast({
            title: 'Coming soon!',
            position: 'top',
            status: 'warning',
          });
          break;
        case GameMasterActions.GIVE_ITEM:
          toast({
            title: 'Coming soon!',
            position: 'top',
            status: 'warning',
          });
          break;
        default:
          break;
      }
    },
    [claimItemModal, toast],
  );

  return (
    <ItemActionsContext.Provider
      value={{
        playerActions,
        gmActions,

        selectedItem,
        selectItem: setSelectedItem,

        openActionModal,
      }}
    >
      {children}
    </ItemActionsContext.Provider>
  );
};
