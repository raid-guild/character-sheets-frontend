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
  OBTAIN_ITEM = 'Obtain item',
  EQUIP_ITEM = 'Equip/Unequip item',
}

export enum GameMasterActions {
  EDIT_ITEM = 'Edit item',
  GIVE_ITEM = 'Give item',
  EDIT_ITEM_WHITELIST = 'Edit item whitelist',
}

type ModalProps = Omit<ReturnType<typeof useDisclosure>, 'onOpen'> | undefined;

type ItemActionsContextType = {
  areAnyItemModalsOpen: boolean;

  playerActions: PlayerActions[];
  gmActions: GameMasterActions[];

  selectedItem: Item | null;
  selectItem: (item: Item) => void;

  openActionModal: (action: PlayerActions | GameMasterActions) => void;
  obtainItemModal: ModalProps;
  equipItemModal: ModalProps;
  editItemWhitelistModal: ModalProps;
};

const ItemActionsContext = createContext<ItemActionsContextType>({
  areAnyItemModalsOpen: false,

  playerActions: [],
  gmActions: [],

  selectedItem: null,
  selectItem: () => {},

  openActionModal: () => {},
  obtainItemModal: undefined,
  equipItemModal: undefined,
  editItemWhitelistModal: undefined,
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

  const obtainItemModal = useDisclosure();
  const equipItemModal = useDisclosure();
  const editItemWhitelistModal = useDisclosure();

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
        case PlayerActions.OBTAIN_ITEM:
          obtainItemModal.onOpen();
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
        case GameMasterActions.EDIT_ITEM_WHITELIST:
          editItemWhitelistModal.onOpen();
          break;
        default:
          break;
      }
    },
    [
      obtainItemModal,
      editItemWhitelistModal,
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
      obtainItemModal.isOpen ||
      equipItemModal.isOpen ||
      editItemWhitelistModal.isOpen,
    [
      obtainItemModal.isOpen,
      editItemWhitelistModal.isOpen,
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
        obtainItemModal,
        equipItemModal,
        editItemWhitelistModal,
      }}
    >
      {children}
    </ItemActionsContext.Provider>
  );
};
