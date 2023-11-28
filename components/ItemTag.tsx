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

import { useGame } from '@/contexts/GameContext';
import { PlayerActions, useItemActions } from '@/contexts/ItemActionsContext';
import { Item } from '@/utils/types';

const fontSizeMap = {
  sm: 'xs',
  md: 'sm',
  lg: 'md',
};

const paddingMap = {
  sm: 2,
  md: 4,
  lg: 6,
};

const spacingMap = {
  sm: 2,
  md: 3,
  lg: 4,
};

type Size = 'sm' | 'md' | 'lg';

type ItemTagProps = {
  holderId?: string;
  item: Item;
  size?: Size;
};

export const ItemTag: React.FC<ItemTagProps> = ({
  size = 'md',
  item,
  holderId,
}) => {
  const { fontSize, padding, spacing } = useMemo(
    () => ({
      fontSize: fontSizeMap[size],
      padding: paddingMap[size],
      spacing: spacingMap[size],
    }),
    [size],
  );

  const { character, pageCharacter } = useGame();

  const { itemId, name, image, amount } = item;

  const showActions = useMemo(() => {
    return (
      size != 'sm' &&
      !!holderId &&
      !!character &&
      holderId === character.characterId
    );
  }, [size, character, holderId]);

  const isEquipped = useMemo(() => {
    const focusedCharacter = pageCharacter ?? character;
    return (
      !!holderId &&
      !!focusedCharacter &&
      holderId === focusedCharacter.characterId &&
      focusedCharacter.equippedItems.find(h => h.itemId === itemId)
    );
  }, [character, holderId, itemId, pageCharacter]);

  const { openActionModal, selectItem } = useItemActions();

  return (
    <VStack
      p={padding}
      spacing={spacing}
      w="auto"
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
      <VStack w="100%">
        <Text textAlign="center" fontSize={fontSize}>
          {name} ({amount.toString()})
        </Text>
        {showActions && !!character && (
          <Button
            onClick={() => {
              selectItem(item);
              openActionModal(PlayerActions.EQUIP_ITEM);
            }}
            size="sm"
            w="100%"
          >
            {isEquipped ? 'Unequip' : 'Equip'}
          </Button>
        )}
      </VStack>
    </VStack>
  );
};
