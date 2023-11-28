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
import { getChainLabelFromId } from '@/lib/web3';
import { BASE_CHARACTER_URI } from '@/utils/constants';
import { Item } from '@/utils/types';

import { useCharacterActions } from './CharacterActionsContext';

export enum PlayerActions {
  CLAIM_ITEM = 'Claim item',
  EQUIP_ITEM = 'Equip/Unequip item',
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
  // addRequirementModal: ModalProps;
  claimItemModal: ModalProps;
  equipItemModal: ModalProps;
  // removeRequirementModal: ModalProps;
  editItemClaimableModal: ModalProps;

  uriNeedsUpgraded: boolean;
};

const ItemActionsContext = createContext<ItemActionsContextType>({
  playerActions: [],
  gmActions: [],

  selectedItem: null,
  selectItem: () => {},

  openActionModal: () => {},
  // addRequirementModal: undefined,
  claimItemModal: undefined,
  equipItemModal: undefined,
  // removeRequirementModal: undefined,
  editItemClaimableModal: undefined,

  uriNeedsUpgraded: false,
});

export const useItemActions = (): ItemActionsContextType =>
  useContext(ItemActionsContext);

export const ItemActionsProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { address } = useAccount();
  const { character, isMaster, game } = useGame();
  const { editCharacterModal } = useCharacterActions();
  const toast = useToast();

  // const addRequirementModal = useDisclosure();
  const claimItemModal = useDisclosure();
  const equipItemModal = useDisclosure();
  // const removeRequirementModal = useDisclosure();
  const editItemClaimableModal = useDisclosure();

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const uriNeedsUpgraded = useMemo(() => {
    if (!(character && game)) return false;
    const chainLabel = getChainLabelFromId(game.chainId);
    const { uri } = character;
    const potentialCID = uri
      .split('/')
      .filter(s => !!s)
      .pop();

    if (!(chainLabel && potentialCID)) return false;

    const baseURI = uri.replace(potentialCID, '');
    if (baseURI !== `${BASE_CHARACTER_URI}${chainLabel}/`) return false;

    return !!potentialCID.match(/^[a-zA-Z0-9]{46,59}$/);
  }, [character, game]);

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

        case PlayerActions.EQUIP_ITEM:
          if (uriNeedsUpgraded) {
            editCharacterModal?.onToggle();
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
      editCharacterModal,
      editItemClaimableModal,
      equipItemModal,
      toast,
      isWrongNetwork,
      renderNetworkError,
      uriNeedsUpgraded,
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
        claimItemModal,
        equipItemModal,
        editItemClaimableModal,

        uriNeedsUpgraded,
      }}
    >
      {children}
    </ItemActionsContext.Provider>
  );
};
