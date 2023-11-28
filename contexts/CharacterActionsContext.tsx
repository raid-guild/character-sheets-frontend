import { useDisclosure } from '@chakra-ui/react';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { zeroAddress } from 'viem';
import { useAccount } from 'wagmi';

import { useGame } from '@/contexts/GameContext';
import { useCheckGameNetwork } from '@/hooks/useCheckGameNetwork';
import { Character, Item } from '@/utils/types';

export enum PlayerActions {
  APPROVE_TRANSFER = 'Approve transfer',
  CLAIM_CLASS = 'Claim class',
  EDIT_CHARACTER = 'Edit character',
  RENOUNCE_CHARACTER = 'Renounce character',
  RENOUNCE_CLASS = 'Renounce class',
}

export enum GameMasterActions {
  ASSIGN_CLASS = 'Assign class',
  JAIL_PLAYER = 'Jail player',
  FREE_PLAYER = 'Free player',
  GIVE_ITEMS = 'Give items',
  GIVE_XP = 'Give XP',
  REVOKE_CLASS = 'Revoke class',
  REMOVE_CHARACTER = 'Remove character',
  TRANSFER_CHARACTER = 'Transfer character',
}

type ModalProps = Omit<ReturnType<typeof useDisclosure>, 'onOpen'> | undefined;

type CharacterActionsContextType = {
  playerActions: PlayerActions[];
  gmActions: GameMasterActions[];

  selectedCharacter: Character | null;
  selectCharacter: (character: Character) => void;

  selectedItem: Item | null;
  selectItem: (item: Item) => void;

  openActionModal: (action: PlayerActions | GameMasterActions) => void;
  approveTransferModal: ModalProps;
  assignClassModal: ModalProps;
  claimClassModal: ModalProps;
  editCharacterModal: ModalProps;
  giveExpModal: ModalProps;
  giveItemsModal: ModalProps;
  jailPlayerModal: ModalProps;
  removeCharacterModal: ModalProps;
  renounceCharacterModal: ModalProps;
  renounceClassModal: ModalProps;
  revokeClassModal: ModalProps;
  transferCharacterModal: ModalProps;
};

const CharacterActionsContext = createContext<CharacterActionsContextType>({
  playerActions: [],
  gmActions: [],

  selectedCharacter: null,
  selectCharacter: () => {},

  selectedItem: null,
  selectItem: () => {},

  openActionModal: () => {},
  approveTransferModal: undefined,
  assignClassModal: undefined,
  claimClassModal: undefined,
  editCharacterModal: undefined,
  giveExpModal: undefined,
  giveItemsModal: undefined,
  jailPlayerModal: undefined,
  removeCharacterModal: undefined,
  renounceCharacterModal: undefined,
  renounceClassModal: undefined,
  revokeClassModal: undefined,
  transferCharacterModal: undefined,
});

export const useCharacterActions = (): CharacterActionsContextType =>
  useContext(CharacterActionsContext);

export const CharacterActionsProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { address } = useAccount();
  const { game, isMaster } = useGame();

  const approveTransferModal = useDisclosure();
  const assignClassModal = useDisclosure();
  const claimClassModal = useDisclosure();
  const editCharacterModal = useDisclosure();
  const giveExpModal = useDisclosure();
  const giveItemsModal = useDisclosure();
  const jailPlayerModal = useDisclosure();
  const removeCharacterModal = useDisclosure();
  const renounceCharacterModal = useDisclosure();
  const renounceClassModal = useDisclosure();
  const revokeClassModal = useDisclosure();
  const transferCharacterModal = useDisclosure();

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
      actions = actions.filter(a => a !== PlayerActions.RENOUNCE_CLASS);
    }

    if (game?.classes.filter(c => c.claimable).length === 0) {
      actions = actions.filter(a => a !== PlayerActions.CLAIM_CLASS);
    }

    if (selectedCharacter?.approved !== zeroAddress) {
      actions = actions.filter(a => a !== PlayerActions.APPROVE_TRANSFER);
    }

    return actions;
  }, [address, game, selectedCharacter]);

  const gmActions = useMemo(() => {
    if (isMaster) {
      let actions = Object.keys(GameMasterActions).map(
        key => GameMasterActions[key as keyof typeof GameMasterActions],
      );

      if (game?.classes.length === 0) {
        actions = actions.filter(a => a !== GameMasterActions.ASSIGN_CLASS);
      }

      if (selectedCharacter?.classes.length === 0) {
        actions = actions.filter(a => a !== GameMasterActions.REVOKE_CLASS);
      }

      if (selectedCharacter?.jailed) {
        actions = actions.filter(a => a !== GameMasterActions.JAIL_PLAYER);
      } else {
        actions = actions.filter(
          a =>
            a !== GameMasterActions.FREE_PLAYER &&
            a !== GameMasterActions.REMOVE_CHARACTER,
        );
      }

      if (selectedCharacter?.approved !== address?.toLowerCase()) {
        actions = actions.filter(
          a => a !== GameMasterActions.TRANSFER_CHARACTER,
        );
      }

      return actions;
    }
    return [];
  }, [address, game, isMaster, selectedCharacter]);

  const { isWrongNetwork, renderNetworkError } = useCheckGameNetwork();

  const openActionModal = useCallback(
    (action: PlayerActions | GameMasterActions) => {
      if (isWrongNetwork) {
        renderNetworkError();
        return;
      }
      switch (action) {
        case GameMasterActions.ASSIGN_CLASS:
          assignClassModal.onOpen();
          break;
        case GameMasterActions.FREE_PLAYER:
          jailPlayerModal.onOpen();
          break;
        case GameMasterActions.GIVE_ITEMS:
          giveItemsModal.onOpen();
          break;
        case GameMasterActions.GIVE_XP:
          giveExpModal.onOpen();
          break;
        case GameMasterActions.JAIL_PLAYER:
          jailPlayerModal.onOpen();
          break;
        case GameMasterActions.REMOVE_CHARACTER:
          removeCharacterModal.onOpen();
          break;
        case GameMasterActions.REVOKE_CLASS:
          revokeClassModal.onOpen();
          break;
        case GameMasterActions.TRANSFER_CHARACTER:
          transferCharacterModal.onOpen();
          break;
        case PlayerActions.APPROVE_TRANSFER:
          approveTransferModal.onOpen();
          break;
        case PlayerActions.CLAIM_CLASS:
          claimClassModal.onOpen();
          break;
        case PlayerActions.EDIT_CHARACTER:
          editCharacterModal.onOpen();
          break;
        case PlayerActions.RENOUNCE_CHARACTER:
          renounceCharacterModal.onOpen();
          break;
        case PlayerActions.RENOUNCE_CLASS:
          renounceClassModal.onOpen();
          break;
        default:
          break;
      }
    },
    [
      isWrongNetwork,
      renderNetworkError,
      approveTransferModal,
      assignClassModal,
      claimClassModal,
      editCharacterModal,
      giveExpModal,
      giveItemsModal,
      jailPlayerModal,
      removeCharacterModal,
      renounceCharacterModal,
      renounceClassModal,
      revokeClassModal,
      transferCharacterModal,
    ],
  );

  return (
    <CharacterActionsContext.Provider
      value={{
        playerActions,
        gmActions,

        selectedCharacter,
        selectCharacter: setSelectedCharacter,

        selectedItem,
        selectItem: setSelectedItem,

        openActionModal,
        approveTransferModal,
        assignClassModal,
        claimClassModal,
        editCharacterModal,
        giveExpModal,
        giveItemsModal,
        jailPlayerModal,
        removeCharacterModal,
        renounceCharacterModal,
        renounceClassModal,
        revokeClassModal,
        transferCharacterModal,
      }}
    >
      {children}
    </CharacterActionsContext.Provider>
  );
};
