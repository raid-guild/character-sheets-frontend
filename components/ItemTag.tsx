import { Button, Image, Text, useToast, VStack } from '@chakra-ui/react';
import { useMemo } from 'react';

import { useGame } from '@/contexts/GameContext';
import { Item } from '@/utils/types';

const fontSizeMap = {
  sm: 'xs',
  md: 'sm',
  lg: 'md',
};

const smallFontSizeMap = {
  sm: '2xs',
  md: 'xs',
  lg: 'sm',
};

const widthMap = {
  sm: '6rem',
  md: '8rem',
  lg: '10rem',
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
  holderId: string;
  item: Item;
  size?: Size;
};

export const ItemTag: React.FC<ItemTagProps> = ({
  size = 'md',
  item,
  holderId,
}) => {
  const toast = useToast();

  const { fontSize, smallFontSize, width, padding, spacing } = useMemo(
    () => ({
      fontSize: fontSizeMap[size],
      smallFontSize: smallFontSizeMap[size],
      width: widthMap[size],
      padding: paddingMap[size],
      spacing: spacingMap[size],
    }),
    [size],
  );

  const { character } = useGame();

  const { itemId, name, image, amount } = item;

  const showActions = useMemo(() => {
    return size != 'sm' && holderId === character?.characterId;
  }, [size, character, holderId]);

  const isEquipped = useMemo(() => {
    return (
      holderId === character?.characterId &&
      character?.equippedItems.find(h => h.itemId === itemId)
    );
  }, [character, holderId, itemId]);

  return (
    <VStack
      p={padding}
      spacing={spacing}
      w={width}
      bg={isEquipped ? 'black' : 'white'}
      color={isEquipped ? 'white' : 'black'}
      border="2px solid black"
      h="100%"
      justify="space-between"
    >
      <Image
        alt={`${name} item image`}
        h="60%"
        objectFit="contain"
        src={image}
        w="100%"
      />
      <VStack spacing={0} w="100%">
        <Text textAlign="center" fontWeight="bold" fontSize={fontSize}>
          {name}
        </Text>
        <Text fontSize={smallFontSize}>
          {amount.toString()} {amount > 1 ? 'items' : 'item'}
        </Text>
      </VStack>
      {showActions && (
        <Button
          onClick={() => {
            toast({
              title: 'Coming soon!',
              position: 'top',
              status: 'warning',
            });
          }}
          size="sm"
          w="100%"
        >
          {isEquipped ? 'Unequip' : 'Equip'}
        </Button>
      )}
    </VStack>
  );
};
