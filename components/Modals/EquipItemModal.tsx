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
  useToast,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useMemo, useState } from 'react';
import { parseAbi } from 'viem';
import { Address, usePublicClient, useWalletClient } from 'wagmi';

import { TransactionPending } from '@/components/TransactionPending';
import { useActions } from '@/contexts/ActionsContext';
import { useGame } from '@/contexts/GameContext';
import { waitUntilBlock } from '@/hooks/useGraphHealth';
import { executeAsCharacter } from '@/utils/account';

export const EquipItemModal: React.FC = () => {
  const { game, reload: reloadGame, character } = useGame();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const toast = useToast();

  const { selectedCharacter, selectedItem, equipItemModal } = useActions();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
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

  const onEquipItem = useCallback(
    async (e: React.FormEvent<HTMLDivElement>) => {
      e.preventDefault();

      if (!walletClient) {
        toast({
          description: 'Wallet client is not connected.',
          position: 'top',
          status: 'error',
        });
        console.error('Could not find a wallet client.');
        return;
      }

      if (!character || !selectedCharacter) {
        toast({
          description: 'Character address not found.',
          position: 'top',
          status: 'error',
        });
        console.error('Character address not found.');
        return;
      }

      if (character.characterId !== selectedCharacter.characterId) {
        toast({
          description: 'Character address does not match.',
          position: 'top',
          status: 'error',
        });
        console.error('Character address does not match.');
        return;
      }

      if (!selectedItem) {
        toast({
          description: 'Item not found.',
          position: 'top',
          status: 'error',
        });
        console.error('Item not found.');
        return;
      }

      if (!game?.id) {
        toast({
          description: `Could not find the game.`,
          position: 'top',
          status: 'error',
        });
        console.error(`Missing game data.`);
        return;
      }

      setIsLoading(true);

      try {
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
        const receipt = await client.waitForTransactionReceipt({
          hash: transactionhash,
        });

        setIsSyncing(true);
        const synced = await waitUntilBlock(receipt.blockNumber);

        if (!synced) {
          toast({
            description: 'Something went wrong while syncing.',
            position: 'top',
            status: 'warning',
          });
          return;
        }
        setIsSynced(true);
        reloadGame();
      } catch (e) {
        toast({
          description: `Something went wrong ${
            isEquipped ? 'unequipping' : 'equipping'
          } item(s).`,
          position: 'top',
          status: 'error',
        });
        console.error(e);
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
      selectedCharacter,
      selectedItem,
      toast,
      walletClient,
      isEquipped,
    ],
  );

  const content = () => {
    if (isSynced) {
      return (
        <VStack py={10} spacing={4}>
          <Text>
            Item(s) successfully {isEquipped ? 'equipped' : 'unequipped'}!
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
          text={`Equipping ${selectedItem.name}.`}
          txHash={txHash}
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
