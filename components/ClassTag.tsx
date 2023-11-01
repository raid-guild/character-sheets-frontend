import { Box, HStack, Image, Text, Tooltip } from '@chakra-ui/react';
import { useMemo } from 'react';
import { hexToNumber, keccak256, toBytes } from 'viem';

type Size = 'sm' | 'md' | 'lg';

type ClassTagProps = {
  name: string;
  image: string;
  size?: Size | 'xs';
};

export const ClassTag: React.FC<ClassTagProps> = ({ size, name, image }) => {
  if (size === 'xs') {
    return <ClassTagInnerExtraSmall name={name} image={image} />;
  }
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
  sm: '1rem',
  md: '1.25rem',
  lg: '1.5rem',
};

const imageHeightMap = {
  sm: '1.5rem',
  md: '2rem',
  lg: '2.5rem',
};

const pxMap = {
  sm: 4,
  md: 8,
  lg: 12,
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

const colors = [
  'softgreen',
  'softpurple',
  'softblue',
  'softyellow',
  'softorange',
];

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

  const bgColor = useMemo(() => {
    // TODO take bgColor from classEntity
    const hexValue = keccak256(toBytes(name));
    const index = hexToNumber(hexValue) % colors.length;
    return colors[index];
  }, [name]);

  return (
    <HStack spacing={0} p={0} w="100%" align="stretch">
      <Box bg={bgColor} my={py} w="6px" />
      <HStack spacing={spacing} bg={bgColor} py={py} px={px}>
        {image && (
          <Image
            alt="class emblem"
            h={imageHeight}
            w={imageWidth}
            objectFit="cover"
            src={image}
          />
        )}
        <Text color="dark" fontSize={fontSize} fontWeight="bold">
          {name}
        </Text>
      </HStack>
      <Box bg={bgColor} my={py} w="6px" />
    </HStack>
  );
};

const ClassTagInnerExtraSmall: React.FC<{
  name: string;
  image: string;
}> = ({ name, image }) => {
  const bgColor = useMemo(() => {
    // TODO take bgColor from classEntity
    const hexValue = keccak256(toBytes(name));
    const index = hexToNumber(hexValue) % colors.length;
    return colors[index];
  }, [name]);

  return (
    <Tooltip aria-label={name} label={name}>
      <Box bg={bgColor} borderRadius="50%" p={1.5}>
        {image && (
          <Image
            alt="class emblem"
            h="16px"
            objectFit="contain"
            src={image}
            w="16px"
          />
        )}
      </Box>
    </Tooltip>
  );
};
