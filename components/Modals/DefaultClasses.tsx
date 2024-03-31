import {
  AspectRatio,
  Button,
  GridItem,
  Image,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useCallback } from 'react';

import { ClassEmblem, DEFAULT_CLASSES, getClassEmblemUrl } from '@/lib/traits';

type DefaultClassesProps = {
  isOpen: boolean;
  onClose: () => void;

  setClassName: (name: string) => void;
  setClassDescription: (name: string) => void;
  setClassEmblemFileName: (image: string) => void;
};

export const DefaultClasses: React.FC<DefaultClassesProps> = ({
  isOpen,
  onClose,
  setClassName,
  setClassDescription,
  setClassEmblemFileName,
}) => {
  const onSelected = useCallback(
    (klass: ClassEmblem) => {
      onClose();
      setClassName(klass.name);
      setClassDescription(klass.description);
      setClassEmblemFileName(klass.emblem);
    },
    [onClose, setClassName, setClassDescription, setClassEmblemFileName],
  );

  if (!isOpen) {
    return null;
  }

  return (
    <VStack align="center" spacing={6} w="100%">
      <SimpleGrid
        alignItems="stretch"
        columns={{ base: 1, sm: 2, md: 3 }}
        spacing={{ base: 4, sm: 6, md: 8 }}
        w="100%"
      >
        {DEFAULT_CLASSES.map(klass => (
          <GridItem key={klass.name} w="100%">
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
              onClick={() => onSelected(klass)}
            >
              <Text fontSize="sm" fontWeight="500" textAlign="center" w="100%">
                {klass.name}
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
                <Image
                  alt={klass.name}
                  src={getClassEmblemUrl(klass.emblem)}
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
