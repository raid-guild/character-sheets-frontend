import { AspectRatio, Image, SimpleGrid, Text, VStack } from '@chakra-ui/react';

import { useIsConnectedAndMounted } from '@/hooks/useIsConnectedAndMounted';
import { shortenText } from '@/utils/helpers';
import { Class } from '@/utils/types';

import { ClassActionMenu } from './ActionMenus/ClassActionMenu';

type ClassCardProps = Class & {
  chainId: number;
};

export const ClassCard: React.FC<ClassCardProps> = ({ ...classEntity }) => {
  const isConnectedAndMounted = useIsConnectedAndMounted();

  const { claimable, classId, name, description, image, holders } = classEntity;

  const claimableDisplay = claimable ? 'Anyone' : 'only GameMaster';

  return (
    <VStack spacing={3} w="100%" h="100%">
      <VStack
        transition="background 0.3s ease"
        p={{ base: 4, md: 6, lg: 8 }}
        spacing={3}
        w="100%"
        borderRadius="md"
        bg="whiteAlpha.100"
        flexGrow={1}
        justify="space-between"
      >
        <VStack spacing={3} w="100%">
          <AspectRatio
            ratio={1}
            h="15rem"
            maxH="15rem"
            w="100%"
            _before={{
              h: '15rem',
              maxH: '15rem',
            }}
          >
            <Image
              alt={name}
              w="100%"
              style={{
                objectFit: 'contain',
              }}
              src={image}
            />
          </AspectRatio>
          <Text fontSize="md" fontWeight="500" w="100%">
            {name}
          </Text>
          <Text fontSize="sm" w="100%">
            {shortenText(description, 130)}
          </Text>
        </VStack>
        <SimpleGrid columns={3} w="100%" spacing={3} mt="4">
          <ClassValue label="Class ID" value={classId} />
          <ClassValue
            label="Held By"
            value={`${holders.length} character${
              holders.length !== 1 ? 's' : ''
            }`}
          />
          <ClassValue label="Claimable By" value={claimableDisplay} />
        </SimpleGrid>
      </VStack>
      {isConnectedAndMounted && (
        <ClassActionMenu variant="solid" {...classEntity} />
      )}
    </VStack>
  );
};

const ClassValue: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => {
  return (
    <VStack align="flex-start" spacing={2}>
      <Text letterSpacing="2px" fontSize="3xs" textTransform="uppercase">
        {label}
      </Text>
      <Text fontSize="2xs" fontWeight="500">
        {value}
      </Text>
    </VStack>
  );
};
