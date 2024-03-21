import {
  Box,
  HStack,
  Image,
  Text,
  Tooltip,
  useDisclosure,
} from '@chakra-ui/react';
import { useMemo } from 'react';
import { hexToNumber, keccak256, toBytes } from 'viem';

import { HeldClass } from '@/utils/types';

import { HeldClassesInfoModal } from './Modals/HeldClassInfoModal';

type Size = 'sm' | 'md' | 'lg';

type ClassTagProps = {
  heldClass: HeldClass;
  size?: Size | 'xs';
};

export const ClassTag: React.FC<ClassTagProps> = ({ heldClass, size }) => {
  if (size === 'xs') {
    return <ClassTagInnerExtraSmall heldClass={heldClass} />;
  }
  return <ClassTagInner heldClass={heldClass} size={size} />;
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
  md: 4,
  lg: 12,
};

const pyMap = {
  sm: 1,
  md: 1,
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
  heldClass: HeldClass;
  size?: Size;
}> = ({ heldClass, size = 'md' }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const { image, level, name } = heldClass;

  const { imageWidth, imageHeight, px, py, spacing } = useMemo(
    () => ({
      imageWidth: imageWidthMap[size],
      imageHeight: imageHeightMap[size],
      px: { base: 1.5, md: pxMap[size] },
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
    <HStack
      align="stretch"
      onClick={onOpen}
      p={0}
      spacing={0}
      w="100%"
      _hover={{ cursor: 'pointer' }}
    >
      <Box bg={bgColor} my={py} w="6px" />
      <HStack spacing={spacing} bg={bgColor} py={py} px={px}>
        {image && (
          <Image
            alt="class emblem"
            h={imageHeight}
            w={imageWidth}
            objectFit="contain"
            src={image}
          />
        )}
        <Text color="dark" fontSize="xs" fontWeight="bold">
          lvl {level}
        </Text>
      </HStack>
      <Box bg={bgColor} my={py} w="6px" />
      <HeldClassesInfoModal
        heldClass={heldClass}
        isOpen={isOpen}
        onClose={onClose}
      />
    </HStack>
  );
};

const ClassTagInnerExtraSmall: React.FC<{
  heldClass: HeldClass;
}> = ({ heldClass }) => {
  const { image, level, name, experience } = heldClass;

  const bgColor = useMemo(() => {
    // TODO take bgColor from classEntity
    const hexValue = keccak256(toBytes(name));
    const index = hexToNumber(hexValue) % colors.length;
    return colors[index];
  }, [name]);

  return (
    <Tooltip
      aria-label={`${experience} ${name} XP`}
      label={`${experience} ${name} XP`}
    >
      <HStack bg={bgColor} borderRadius="full" px={2.5} py={1}>
        {image && (
          <Image
            alt="class emblem"
            h="16px"
            objectFit="contain"
            src={image}
            w="16px"
          />
        )}
        <Text color="dark" fontSize="xs" fontWeight="bold">
          {level}
        </Text>
      </HStack>
    </Tooltip>
  );
};
