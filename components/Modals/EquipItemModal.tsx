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
import { useGame } from '@/contexts/GameContext';
import { useItemActions } from '@/contexts/ItemActionsContext';
import { waitUntilBlock } from '@/graphql/health';
import { useToast } from '@/hooks/useToast';
import {
  EquippableTraitType,
  getTraitsObjectFromAttributes,
} from '@/lib/traits';
import { getChainLabelFromId } from '@/lib/web3';
import { executeAsCharacter } from '@/utils/account';

export const EquipItemModal: React.FC = () => {
  const { game, reload: reloadGame, character } = useGame();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { renderError } = useToast();

  const { selectedItem, equipItemModal } = useItemActions();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txFailed, setTxFailed] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSynced, setIsSynced] = useState<boolean>(false);

  const isEquipped = useMemo(() => {
    if (!selectedItem || !character) {
      return false;
    }

    return (
      character.equippedItems.find(e => e.itemId === selectedItem.itemId) !==
      undefined
    );
  }, [character, selectedItem]);

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
        if (!character) throw new Error('Character address not found');
        if (!selectedItem) throw new Error('Item not found');
        if (!game?.id) throw new Error(`Missing game data`);

        setIsLoading(true);

        const {
          attributes: characterAttributes,
          description: characterDescription,
          id,
          name: characterName,
        } = character;
        const {
          attributes: itemAttributes,
          equippable_layer,
          name: itemName,
        } = selectedItem;
        if (
          characterAttributes &&
          characterAttributes.length >= 6 &&
          itemAttributes &&
          itemAttributes.length >= 0 &&
          equippable_layer
        ) {
          const traits = getTraitsObjectFromAttributes(characterAttributes);
          if (
            !(
              itemAttributes[0]?.value &&
              itemAttributes[0]?.trait_type === 'EQUIPPABLE TYPE'
            )
          )
            throw new Error('Missing equippable item type value');

          const newTrait = isEquipped
            ? `remove_${itemName}_${equippable_layer}`
            : `equip_${itemName}_${equippable_layer}`;
          traits[itemAttributes[0].value as EquippableTraitType] = newTrait;

          const response = await fetch(`/api/uploadTraits`, {
            method: 'POST',
            body: JSON.stringify({
              characterId: id,
              chainId: game.chainId,
              traits,
            }),
          });

          if (!response.ok)
            throw new Error('Something went wrong uploading new avatar image');

          const { attributes, cid } = await response.json();

          if (!(attributes && cid))
            throw new Error('Something went wrong uploading new avatar image');

          const characterMetadata: {
            name: string;
            description: string;
            image: string;
            attributes?: {
              trait_type: string;
              value: string;
            }[];
          } = {
            name: characterName,
            description: characterDescription,
            image: `ipfs://${cid}`,
          };

          characterMetadata['attributes'] = attributes;

          const chainLabel = getChainLabelFromId(game.chainId);
          const apiRoute = `/api/characters/${chainLabel}/${id}/update`;
          const signature = await walletClient.signMessage({
            message: apiRoute,
            account: walletClient.account?.address as Address,
          });

          const res = await fetch(apiRoute, {
            headers: {
              'x-account-address': walletClient.account?.address as Address,
              'x-account-signature': signature,
              'x-account-chain-id': walletClient.chain.id.toString(),
            },
            method: 'POST',
            body: JSON.stringify(characterMetadata),
          });
          if (!res.ok)
            throw new Error(
              "Something went wrong updating your character's metadata",
            );

          const { name, description, image } = await res.json();
          if (!(name && description && image))
            throw new Error(
              'Something went wrong updating your character metadata',
            );
        }

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

    if (!character) {
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
        {character.attributes.length === 0 && !isEquipped && (
          <Text color="red" textAlign="center">
            Note: because you are using your own character avatar, you will not
            be able to equip this item visually.
          </Text>
        )}
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
          variant="solid"
          alignSelf="flex-end"
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
      <ModalContent mt={{ base: 0, md: '84px' }}>
        <ModalHeader>
          <Text>{isEquipped ? 'Unequip item' : 'Equip item'}</Text>
          <ModalCloseButton size="lg" />
        </ModalHeader>
        <ModalBody>{content()}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
