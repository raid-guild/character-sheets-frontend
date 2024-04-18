import {
  AspectRatio,
  Button,
  Image,
  SimpleGrid,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
} from '@chakra-ui/react';
import { useState } from 'react';

import { useIsConnectedAndMounted } from '@/hooks/useIsConnectedAndMounted';
import { shortenText } from '@/utils/helpers';
import { Class } from '@/utils/types';

import { ClassActionMenu } from './ActionMenus/ClassActionMenu';

type ClassCardProps = Class & {
  dummy?: boolean;
};

export const ClassCard: React.FC<ClassCardProps> = ({
  dummy = false,
  ...classEntity
}) => {
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
      {isConnectedAndMounted && !dummy && (
        <ClassActionMenu classEntity={classEntity as Class} variant="solid" />
      )}
    </VStack>
  );
};

export const ClassCardSmall: React.FC<ClassCardProps> = ({
  dummy = false,
  ...classEntity
}) => {
  const isConnectedAndMounted = useIsConnectedAndMounted();

  const [showDetails, setShowDetails] = useState(false);

  const { claimable, classId, name, description, image, holders } = classEntity;
  const claimableDisplay = claimable ? 'Anyone' : 'only GameMaster';

  return (
    <VStack h="100%" spacing={3} w="100%">
      <VStack
        borderRadius="md"
        bg="whiteAlpha.100"
        flexGrow={1}
        justify="space-between"
        p={{ base: 4, md: 6 }}
        spacing={3}
        transition="background 0.3s ease"
        w="100%"
      >
        <VStack spacing={3} w="100%">
          <Text fontSize="sm" fontWeight="500" textAlign="center" w="100%">
            {name}
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
              alt={name}
              src={image}
              style={{
                objectFit: 'contain',
              }}
              w="100%"
            />
          </AspectRatio>
          <Button
            fontSize="xs"
            onClick={() => setShowDetails(!showDetails)}
            textDecor="underline"
            transition="color 0.2s ease"
            variant="link"
            _hover={{
              color: 'whiteAlpha.500',
            }}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
          {showDetails && (
            <Text fontSize="xs" w="100%">
              {shortenText(description, 130)}
            </Text>
          )}
        </VStack>
        {showDetails && (
          <SimpleGrid columns={2} mt="4" spacing={3} w="100%">
            <ClassValue label="Class ID" value={classId} />
            <ClassValue
              label="Held By"
              value={`${holders.length} character${
                holders.length !== 1 ? 's' : ''
              }`}
            />
            <ClassValue label="Claimable By" value={claimableDisplay} />
          </SimpleGrid>
        )}
      </VStack>
      {isConnectedAndMounted && !dummy && (
        <ClassActionMenu classEntity={classEntity as Class} variant="solid" />
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

export const ClassesTable: React.FC<{
  classes: Class[];
}> = ({ classes }) => {
  const isConnectedAndMounted = useIsConnectedAndMounted();

  return (
    <TableContainer w="100%">
      <Table size="sm" w={{ base: '800px', md: '100%' }}>
        <Thead>
          <Tr>
            {isConnectedAndMounted && <Th>Actions</Th>}
            <Th>ID</Th>
            <Th>Name</Th>
            <Th>Description</Th>
            <Th>Holders</Th>
            <Th>Claimable</Th>
          </Tr>
        </Thead>
        <Tbody>
          {classes.map(c => (
            <Tr key={c.id}>
              {isConnectedAndMounted && (
                <Td>
                  <ClassActionMenu classEntity={c} size="xs" variant="solid" />
                </Td>
              )}
              <Td minH="60px">{c.classId}</Td>
              <Td alignItems="center" display="flex" gap={4}>
                <Image alt={c.name} h="40px" src={c.image} />
                <Text>{shortenText(c.name, 20)}</Text>
              </Td>
              <Td>
                <Text fontSize="xs">{shortenText(c.description, 20)}</Text>
              </Td>
              <Td>{c.holders.length}</Td>
              <Td>{c.claimable ? 'Yes' : 'No'}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};
