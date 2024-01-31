import { AspectRatio, Box, Image } from '@chakra-ui/react';

import { getImageUrl, TraitsArray } from '@/lib/traits';

export const CompositeCharacterImage: React.FC<{ traits: TraitsArray }> = ({
  traits,
}) => {
  return (
    <AspectRatio ratio={10 / 13} w="full">
      <Box bg="accent" borderRadius="10px" pos="relative">
        {traits.map((trait: string) => {
          if (!trait) return null;
          return (
            <Image
              alt={`${trait.split('_')[1]} trait layer`}
              h="100%"
              key={`composit-trait-image-${trait}`}
              left={0}
              objectFit="cover"
              pos="absolute"
              src={getImageUrl(trait)}
              top={0}
              w="100%"
            />
          );
        })}
      </Box>
    </AspectRatio>
  );
};
