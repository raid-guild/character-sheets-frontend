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
import { useCheckGameNetwork } from '@/hooks/useCheckGameNetwork';

export enum PlayerActions {
  CLAIM_ITEM = 'Claim item',
}

export enum GameMasterActions {
  EDIT_ITEM = 'Edit item',
  GIVE_ITEM = 'Give item',
  // TODO: Remove these (and their modals) completetely once we are positive we don't need them
  // ADD_REQUIREMENT = 'Add requirement',
  // REMOVE_REQUIREMENT = 'Remove requirement',
  EDIT_ITEM_CLAIMABLE = 'Edit item claimable',
}

type ModalProps = Omit<ReturnType<typeof useDisclosure>, 'onOpen'> | undefined;

type ItemActionsContextType = {
  playerActions: PlayerActions[];
  gmActions: GameMasterActions[];

  selectedItem: Item | null;
  selectItem: (item: Item) => void;

  openActionModal: (action: PlayerActions | GameMasterActions) => void;
  addRequirementModal: ModalProps;
  claimItemModal: ModalProps;
  removeRequirementModal: ModalProps;
  editItemClaimableModal: ModalProps;
};

const ItemActionsContext = createContext<ItemActionsContextType>({
  playerActions: [],
  gmActions: [],

  selectedItem: null,
  selectItem: () => {},

  openActionModal: () => {},
  addRequirementModal: undefined,
  claimItemModal: undefined,
  removeRequirementModal: undefined,
  editItemClaimableModal: undefined,
});

export const useItemActions = (): ItemActionsContextType =>
  useContext(ItemActionsContext);

export const ItemActionsProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { address } = useAccount();
  const { character, isMaster } = useGame();
  const toast = useToast();

  const addRequirementModal = useDisclosure();
  const claimItemModal = useDisclosure();
  const removeRequirementModal = useDisclosure();
  const editItemClaimableModal = useDisclosure();

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
      const actions = Object.keys(GameMasterActions).map(
        key => GameMasterActions[key as keyof typeof GameMasterActions],
      );

      // TODO: For now we are only adding/checking class requirements
      // if (selectedItem?.requirements.length === game?.classes.length) {
      //   actions = actions.filter(a => a !== GameMasterActions.ADD_REQUIREMENT);
      // }

      // if (selectedItem?.requirements.length === 0) {
      //   actions = actions.filter(
      //     a => a !== GameMasterActions.REMOVE_REQUIREMENT,
      //   );
      // }

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
        // case GameMasterActions.ADD_REQUIREMENT:
        //   addRequirementModal.onOpen();
        //   break;
        // case GameMasterActions.REMOVE_REQUIREMENT:
        //   removeRequirementModal.onOpen();
        //   break;
        case GameMasterActions.EDIT_ITEM_CLAIMABLE:
          editItemClaimableModal.onOpen();
          break;
        default:
          break;
      }
    },
    [
      claimItemModal,
      editItemClaimableModal,
      toast,
      isWrongNetwork,
      renderNetworkError,
    ],
  );

  return (
    <ItemActionsContext.Provider
      value={{
        playerActions,
        gmActions,

        selectedItem,
        selectItem: setSelectedItem,

        openActionModal,
        addRequirementModal,
        claimItemModal,
        removeRequirementModal,
        editItemClaimableModal,
      }}
    >
      {children}
    </ItemActionsContext.Provider>
  );
};
