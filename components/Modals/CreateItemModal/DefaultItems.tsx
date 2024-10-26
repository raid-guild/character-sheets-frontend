import {
  AspectRatio,
  Button,
  GridItem,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useCallback } from 'react';

import { MultiSourceImage } from '@/components/MultiSourceImage';
import {
  DEFAULT_ITEMS,
  EquippableTraitType,
  getImageUri,
  ItemLayer,
  ItemType,
} from '@/lib/traits';

type DefaultItemsProps = {
  isOpen: boolean;
  onClose: () => void;

  setItemName: (name: string) => void;
  setItemDescription: (name: string) => void;
  setItemEmblemFileName: (image: string) => void;
  setItemLayerFileName: (layer: string) => void;
  setItemType: (type: ItemType) => void;
  setEquippableType: (type: EquippableTraitType) => void;
};

export const DefaultItems: React.FC<DefaultItemsProps> = ({
  isOpen,
  onClose,
  setItemName,
  setItemDescription,
  setItemEmblemFileName,
  setItemLayerFileName,
  setItemType,
  setEquippableType,
}) => {
  const onSelected = useCallback(
    (item: ItemLayer) => {
      onClose();
      setItemName(item.name);
      setItemDescription(item.description);
      setItemEmblemFileName(item.thumbnail);
      setItemLayerFileName(item.layer);
      setItemType(item.itemType);
      if (item.equippableType) {
        setEquippableType(item.equippableType);
      }
    },
    [
      onClose,
      setItemName,
      setItemDescription,
      setItemEmblemFileName,
      setItemLayerFileName,
      setItemType,
      setEquippableType,
    ],
  );

  if (!isOpen) {
    return null;
  }

  return (
    <VStack w="100%" spacing={6} align="center">
      <SimpleGrid
        alignItems="stretch"
        columns={{ base: 1, sm: 2, md: 3 }}
        spacing={{ base: 4, sm: 6, md: 8 }}
        w="100%"
      >
        {DEFAULT_ITEMS.map(item => (
          <GridItem key={item.name} w="100%">
            <VStack
              borderRadius="md"
              bg="whiteAlpha.100"
              flexGrow={1}
              justify="space-between"
              p={{ base: 4, md: 6 }}
              spacing={3}
              w="100%"
              _hover={{
                bg: 'whiteAlpha.200',
              }}
              cursor="pointer"
              onClick={() => onSelected(item)}
            >
              <Text fontSize="sm" fontWeight="500" textAlign="center" w="100%">
                {item.name}
              </Text>
              <AspectRatio
                h="10rem"
                maxH="10rem"
                ratio={1}
                w="100%"
                _before={{
                  h: '10rem',
                  maxH: '10rem',
                }}
              >
                <MultiSourceImage
                  alt={item.name}
                  src={getImageUri(item.thumbnail)}
                  style={{
                    objectFit: 'contain',
                  }}
                  w="100%"
                />
              </AspectRatio>
            </VStack>
          </GridItem>
        ))}
      </SimpleGrid>
      <Button variant="outline" onClick={onClose}>
        Go Back
      </Button>
    </VStack>
  );
};
