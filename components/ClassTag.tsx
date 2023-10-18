import { HStack, Image, Text } from '@chakra-ui/react';
import { useMemo } from 'react';

import { Class } from '@/utils/types';

type Size = 'sm' | 'md' | 'lg';

type ClassTagProps = {
  classEntity: Class;
  size?: Size;
};

export const ClassTag: React.FC<ClassTagProps> = ({ size, classEntity }) => {
  const { name, image } = classEntity;
  return <ClassTagInner name={name} image={image} size={size} />;
};

export const VillagerClassTag: React.FC<{ size?: Size }> = ({ size }) => {
  return <ClassTagInner name="Villager" image="/villager.png" size={size} />;
};

const fontSizeMap = {
  sm: 'xs',
  md: 'sm',
  lg: 'md',
};

const imageWidthMap = {
  sm: '1.25rem',
  md: '1.5rem',
  lg: '2rem',
};

const imageHeightMap = {
  sm: '2rem',
  md: '2.5rem',
  lg: '3rem',
};

const pxMap = {
  sm: 2,
  md: 4,
  lg: 6,
};

const pyMap = {
  sm: 1,
  md: 2,
  lg: 3,
};

const spacingMap = {
  sm: 2,
  md: 3,
  lg: 4,
};

const ClassTagInner: React.FC<{
  name: string;
  image: string;
  size?: Size;
}> = ({ name, image, size = 'md' }) => {
  const { fontSize, imageWidth, imageHeight, px, py, spacing } = useMemo(
    () => ({
      fontSize: fontSizeMap[size],
      imageWidth: imageWidthMap[size],
      imageHeight: imageHeightMap[size],
      px: pxMap[size],
      py: pyMap[size],
      spacing: spacingMap[size],
    }),
    [size],
  );

  return (
    <HStack border="2px solid white" px={px} py={py} spacing={spacing} w="100%">
      <Image
        alt="class emblem"
        h={imageHeight}
        w={imageWidth}
        objectFit="cover"
        src={image}
      />
      <Text fontWeight="bold" fontSize={fontSize}>
        {name}
      </Text>
    </HStack>
  );
};
