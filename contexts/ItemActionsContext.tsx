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
import { useCheckGameNetwork } from '@/hooks/useCheckGameNetwork';
import { Item } from '@/utils/types';

import { useCharacterActions } from './CharacterActionsContext';

export enum PlayerActions {
  CLAIM_ITEM = 'Claim item',
  EQUIP_ITEM = 'Equip/Unequip item',
}

export enum GameMasterActions {
  EDIT_ITEM = 'Edit item',
  GIVE_ITEM = 'Give item',
  EDIT_ITEM_CLAIMABLE = 'Edit item claimable',
}

type ModalProps = Omit<ReturnType<typeof useDisclosure>, 'onOpen'> | undefined;

type ItemActionsContextType = {
  areAnyItemModalsOpen: boolean;

  playerActions: PlayerActions[];
  gmActions: GameMasterActions[];

  selectedItem: Item | null;
  selectItem: (item: Item) => void;

  openActionModal: (action: PlayerActions | GameMasterActions) => void;
  claimItemModal: ModalProps;
  equipItemModal: ModalProps;
  editItemClaimableModal: ModalProps;
};

const ItemActionsContext = createContext<ItemActionsContextType>({
  areAnyItemModalsOpen: false,

  playerActions: [],
  gmActions: [],

  selectedItem: null,
  selectItem: () => {},

  openActionModal: () => {},
  claimItemModal: undefined,
  equipItemModal: undefined,
  editItemClaimableModal: undefined,
});

export const useItemActions = (): ItemActionsContextType =>
  useContext(ItemActionsContext);

export const ItemActionsProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { address } = useAccount();
  const { character, isMaster } = useGame();
  const { setShowEditCharacter, uriNeedsUpgraded } = useCharacterActions();
  const toast = useToast();

  const claimItemModal = useDisclosure();
  const equipItemModal = useDisclosure();
  const editItemClaimableModal = useDisclosure();

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const playerActions = useMemo(() => {
    if (character?.player !== address?.toLowerCase()) {
      return [];
    }

    let actions = Object.keys(PlayerActions).map(
      key => PlayerActions[key as keyof typeof PlayerActions],
    );

    const itemHolderIds = selectedItem?.holders.map(h => h.characterId) ?? [];
    if (!itemHolderIds.includes(character?.characterId ?? '')) {
      actions = actions.filter(a => a !== PlayerActions.EQUIP_ITEM);
    }

    return actions;
  }, [address, character, selectedItem]);

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
        case PlayerActions.CLAIM_ITEM:
          claimItemModal.onOpen();
          break;

        case PlayerActions.EQUIP_ITEM:
          if (uriNeedsUpgraded) {
            setShowEditCharacter(true);
            return;
          }
          equipItemModal.onOpen();
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
      equipItemModal,
      toast,
      isWrongNetwork,
      renderNetworkError,
      setShowEditCharacter,
      uriNeedsUpgraded,
    ],
  );

  const areAnyItemModalsOpen = useMemo(
    () =>
      claimItemModal.isOpen ||
      equipItemModal.isOpen ||
      editItemClaimableModal.isOpen,
    [
      claimItemModal.isOpen,
      editItemClaimableModal.isOpen,
      equipItemModal.isOpen,
    ],
  );

  return (
    <ItemActionsContext.Provider
      value={{
        areAnyItemModalsOpen,

        playerActions,
        gmActions,

        selectedItem,
        selectItem: setSelectedItem,

        openActionModal,
        claimItemModal,
        equipItemModal,
        editItemClaimableModal,
      }}
    >
      {children}
    </ItemActionsContext.Provider>
  );
};
