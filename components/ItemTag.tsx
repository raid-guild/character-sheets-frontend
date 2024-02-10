import { CheckIcon } from '@chakra-ui/icons';
import {
  AspectRatio,
  Button,
  Flex,
  Image,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useMemo } from 'react';

import { useCharacterActions } from '@/contexts/CharacterActionsContext';
import { PlayerActions, useItemActions } from '@/contexts/ItemActionsContext';
import { useIsConnectedAndMounted } from '@/hooks/useIsConnectedAndMounted';
import { Item } from '@/utils/types';

type ItemTagProps = {
  holderId?: string;
  item: Item;
};

export const ItemTag: React.FC<ItemTagProps> = ({ item, holderId }) => {
  const { selectedCharacter } = useCharacterActions();

  const { itemId, name, image, amount } = item;

  const isConnectedAndMounted = useIsConnectedAndMounted();

  const isHolder = useMemo(
    () =>
      !!holderId &&
      !!selectedCharacter &&
      holderId === selectedCharacter.characterId &&
      isConnectedAndMounted,
    [holderId, isConnectedAndMounted, selectedCharacter],
  );

  const isEquipped = useMemo(() => {
    return (
      !!holderId &&
      !!selectedCharacter &&
      holderId === selectedCharacter.characterId &&
      selectedCharacter.equippedItems.find(h => h.itemId === itemId)
    );
  }, [holderId, itemId, selectedCharacter]);

  const { openActionModal, selectItem } = useItemActions();

  return (
    <VStack spacing={2} w="100%" h="100%">
      <VStack
        p={4}
        spacing={3}
        w="100%"
        h="100%"
        justify="space-between"
        bg="whiteAlpha.100"
        borderRadius="lg"
        pos="relative"
      >
        {isEquipped && (
          <Flex
            borderRadius="50%"
            pos="absolute"
            w="1.675rem"
            h="1.675rem"
            top={2}
            right={2}
            bg="dark"
            justify="center"
            align="center"
          >
            <CheckIcon color="white" w="0.875rem" />
          </Flex>
        )}
        <AspectRatio ratio={1} w="100%">
          <Image
            alt={name}
            w="100%"
            style={{
              objectFit: 'contain',
            }}
            src={image}
          />
        </AspectRatio>
        <Text textAlign="center" fontSize="sm">
          {name} ({amount.toString()})
        </Text>
      </VStack>

      {isHolder && (
        <Button
          onClick={() => {
            selectItem(item);
            openActionModal(PlayerActions.EQUIP_ITEM);
          }}
          size="sm"
          w="100%"
          variant="solid"
        >
          {isEquipped ? 'Unequip' : 'Equip'}
        </Button>
      )}
    </VStack>
  );
};
