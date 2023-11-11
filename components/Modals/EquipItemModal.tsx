import {
  Button,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { parseAbi } from 'viem';
import { Address, usePublicClient, useWalletClient } from 'wagmi';

import { TransactionPending } from '@/components/TransactionPending';
import { useCharacterActions } from '@/contexts/CharacterActionsContext';
import { useGame } from '@/contexts/GameContext';
import { waitUntilBlock } from '@/graphql/health';
import { useToast } from '@/hooks/useToast';
import { executeAsCharacter } from '@/utils/account';

export const EquipItemModal: React.FC = () => {
  const { game, reload: reloadGame, character } = useGame();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { renderError } = useToast();

  const { selectedCharacter, selectedItem, equipItemModal } =
    useCharacterActions();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txFailed, setTxFailed] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSynced, setIsSynced] = useState<boolean>(false);

  const isEquipped = useMemo(() => {
    if (!selectedItem || !selectedCharacter || !character) {
      return false;
    }
    if (character.characterId !== selectedCharacter.characterId) {
      return false;
    }

    return (
      selectedCharacter.equippedItems.find(
        e => e.itemId === selectedItem.itemId,
      ) !== undefined
    );
  }, [character, selectedItem, selectedCharacter]);

  const resetData = useCallback(() => {
    setTxHash(null);
    setTxFailed(false);
    setIsSyncing(false);
    setIsSynced(false);
  }, []);

  useEffect(() => {
    if (!equipItemModal?.isOpen) {
      resetData();
    }
  }, [resetData, equipItemModal?.isOpen]);

  const onEquipItem = useCallback(
    async (e: React.FormEvent<HTMLDivElement>) => {
      e.preventDefault();

      try {
        if (!walletClient) throw new Error('Wallet client is not connected');
        if (!character || !selectedCharacter)
          throw new Error('Character address not found');
        if (character.characterId !== selectedCharacter.characterId)
          throw new Error('Character address does not match');
        if (!selectedItem) throw new Error('Item not found');
        if (!game?.id) throw new Error(`Missing game data`);

        setIsLoading(true);

        const transactionhash = await executeAsCharacter(
          character,
          walletClient,
          {
            chain: walletClient.chain,
            account: walletClient.account?.address as Address,
            address: game.id as Address,
            abi: parseAbi([
              'function unequipItemFromCharacter(uint256 characterId, uint256 tokenId) external',
              'function equipItemToCharacter(uint256 characterId, uint256 tokenId) external',
            ]),
            functionName: isEquipped
              ? 'unequipItemFromCharacter'
              : 'equipItemToCharacter',
            args: [BigInt(character.characterId), BigInt(selectedItem.itemId)],
          },
        );
        setTxHash(transactionhash);

        const client = publicClient ?? walletClient;
        const { blockNumber, status } = await client.waitForTransactionReceipt({
          hash: transactionhash,
        });

        if (status === 'reverted') {
          setTxFailed(true);
          setIsLoading(false);
          throw new Error('Transaction failed');
        }

        setIsSyncing(true);
        const synced = await waitUntilBlock(client.chain.id, blockNumber);
        if (!synced) throw new Error('Something went wrong while syncing');

        setIsSynced(true);
        reloadGame();
      } catch (e) {
        renderError(
          e,
          `Something went wrong ${
            isEquipped ? 'unequipping' : 'equipping'
          } item(s)`,
        );
      } finally {
        setIsSyncing(false);
        setIsLoading(false);
      }
    },
    [
      publicClient,
      game,
      reloadGame,
      character,
      renderError,
      selectedCharacter,
      selectedItem,
      walletClient,
      isEquipped,
    ],
  );

  const content = () => {
    if (txFailed) {
      return (
        <VStack py={10} spacing={4}>
          <Text>Transaction failed.</Text>
          <Button onClick={equipItemModal?.onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

    if (isSynced) {
      return (
        <VStack py={10} spacing={4}>
          <Text>
            {/* NOTE: Becuase the game data reloads before this text appears, the logic is flipped */}
            Item(s) successfully {isEquipped ? 'unequipped' : 'equipped'}!
          </Text>
          <Button onClick={equipItemModal?.onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

    if (txHash && selectedItem) {
      return (
        <TransactionPending
          isSyncing={isSyncing}
          text={`${isEquipped ? 'Unequipping' : 'Equipping'} ${
            selectedItem.name
          }.`}
          txHash={txHash}
          chainId={game?.chainId}
        />
      );
    }

    if (!character || !selectedCharacter) {
      return (
        <VStack py={10} spacing={4}>
          <Text>Character not found.</Text>
          <Button onClick={equipItemModal?.onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

    const heldItem = character.heldItems.find(
      e => e.itemId === selectedItem?.itemId,
    );

    if (!selectedItem || !heldItem) {
      return (
        <VStack py={10} spacing={4}>
          <Text>Item not found.</Text>
          <Button onClick={equipItemModal?.onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

    return (
      <VStack as="form" onSubmit={onEquipItem} spacing={8}>
        <Text>
          Are you sure you want to {isEquipped ? 'unequip' : 'equip'} this item?
        </Text>
        <VStack justify="space-between" h="100%">
          <Image
            alt={`${heldItem.name} image`}
            h="20rem"
            objectFit="contain"
            src={heldItem.image}
            w="100%"
          />
          <Text textAlign="center">{heldItem.name}</Text>
          <Text fontSize="xs">Amount: {heldItem.amount.toString()}</Text>
        </VStack>
        <Button
          isLoading={isLoading}
          loadingText={isEquipped ? 'Unequipping...' : 'Equipping...'}
          type="submit"
        >
          {isEquipped ? 'Unequip' : 'Equip'}
        </Button>
      </VStack>
    );
  };

  return (
    <Modal
      closeOnEsc={!isLoading}
      closeOnOverlayClick={!isLoading}
      isOpen={equipItemModal?.isOpen ?? false}
      onClose={equipItemModal?.onClose ?? (() => {})}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Text>{isEquipped ? 'Unequip item' : 'Equip item'}</Text>
          <ModalCloseButton size="lg" />
        </ModalHeader>
        <ModalBody>{content()}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
