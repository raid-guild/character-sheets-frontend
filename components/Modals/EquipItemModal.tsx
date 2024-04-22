import { Button, Image, Text, VStack } from '@chakra-ui/react';
import { useCallback, useState } from 'react';
import { Address, parseAbi } from 'viem';
import { useWalletClient } from 'wagmi';

import { useGame } from '@/contexts/GameContext';
import { useItemActions } from '@/contexts/ItemActionsContext';
import {
  EquippableTraitType,
  formatTraitsForUpload,
  getTraitsObjectFromAttributes,
  ItemType,
} from '@/lib/traits';
import { getChainLabelFromId } from '@/lib/web3';
import { executeAsCharacter } from '@/utils/account';

import { ActionModal } from './ActionModal';

export const EquipItemModal: React.FC = () => {
  const { game, reload: reloadGame, character } = useGame();
  const { data: walletClient } = useWalletClient();

  const { selectedItem, equipItemModal } = useItemActions();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEquipped, setIsEquipped] = useState<boolean>(false);

  const onGetIsEquipped = useCallback(() => {
    if (!selectedItem || !character) {
      return false;
    }

    return (
      character.equippedItems.find(e => e.itemId === selectedItem.itemId) !==
      undefined
    );
  }, [character, selectedItem]);

  const resetData = useCallback(() => {
    setIsEquipped(onGetIsEquipped());
    setIsLoading(false);
  }, [onGetIsEquipped]);

  const onEquipItem = useCallback(async () => {
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

      const isVisuallyEquippable = itemAttributes.find(
        attributes =>
          attributes.trait_type === 'ITEM TYPE' &&
          attributes.value === ItemType.EQUIPPABLE,
      );

      if (
        characterAttributes &&
        characterAttributes.length >= 6 &&
        itemAttributes &&
        itemAttributes.length >= 0 &&
        equippable_layer &&
        itemAttributes &&
        isVisuallyEquippable
      ) {
        const traits = getTraitsObjectFromAttributes(characterAttributes);
        const equippableType = itemAttributes.find(
          attributes => attributes.trait_type === 'EQUIPPABLE TYPE',
        );

        if (!equippableType?.value)
          throw new Error('Missing equippable item type value');

        const newTrait = isEquipped
          ? `remove_${itemName}_${equippable_layer}`
          : `equip_${itemName}_${equippable_layer}`;
        traits[equippableType.value as EquippableTraitType] = newTrait;

        const traitsArray = await formatTraitsForUpload(
          traits,
          game.chainId,
          character.id,
        );

        if (!traitsArray)
          throw new Error('Something went wrong uploading your character');

        const response = await fetch(`/api/uploadTraits`, {
          method: 'POST',
          body: JSON.stringify({
            traitsArray,
            traitsObject: traits,
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
      return transactionhash;
    } catch (e) {
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [game, character, selectedItem, walletClient, isEquipped]);

  const heldItem = character?.heldItems.find(
    e => e.itemId === selectedItem?.itemId,
  );

  const error = !character
    ? 'Character not found'
    : !selectedItem || !heldItem
      ? 'Item not found'
      : null;

  return (
    <ActionModal
      {...{
        isOpen: equipItemModal?.isOpen,
        onClose: equipItemModal?.onClose,
        header: `${isEquipped ? 'Unequip' : 'Equip'} Item`,
        loadingText: `${isEquipped ? 'Unequipping' : 'Equipping'}...`,
        successText: `Success!`,
        errorText: `There was an error ${
          isEquipped ? 'unequipping' : 'equipping'
        } the item.`,
        resetData,
        onAction: onEquipItem,
        onComplete: reloadGame,
      }}
    >
      {error ? (
        <VStack py={10} spacing={4}>
          <Text>{error}</Text>
          <Button onClick={equipItemModal?.onClose} variant="outline">
            Close
          </Button>
        </VStack>
      ) : (
        <VStack spacing={8} w="100%">
          <Text>
            Are you sure you want to {isEquipped ? 'unequip' : 'equip'} this
            item?
          </Text>
          {character?.attributes.length === 0 && !isEquipped && (
            <Text color="red" textAlign="center">
              Note: because you are using your own character avatar, you will
              not be able to equip this item visually.
            </Text>
          )}
          <VStack justify="space-between" h="100%">
            <Image
              alt={`${heldItem?.name} image`}
              h="20rem"
              objectFit="contain"
              src={heldItem?.image}
              w="100%"
            />
            <Text textAlign="center">{heldItem?.name}</Text>
            <Text fontSize="xs">Amount: {heldItem?.amount.toString()}</Text>
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
      )}
    </ActionModal>
  );
};
