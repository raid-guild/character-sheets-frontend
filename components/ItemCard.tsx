import { CheckIcon } from '@chakra-ui/icons';
import {
  AspectRatio,
  Button,
  Divider,
  Flex,
  HStack,
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

import { ItemActionMenu } from '@/components/ActionMenus/ItemActionMenu';
import { useGame } from '@/contexts/GameContext';
import { useIsConnectedAndMounted } from '@/hooks/useIsConnectedAndMounted';
import { shortenText } from '@/utils/helpers';
import { Item } from '@/utils/types';

type ItemCardProps = Item & {
  holderId?: string;
  dummy?: boolean;
};

export const ItemCard: React.FC<ItemCardProps> = ({
  holderId,
  dummy = false,
  ...item
}) => {
  const isConnectedAndMounted = useIsConnectedAndMounted();

  const {
    description,
    equippers,
    holders,
    image,
    itemId,
    name,
    soulbound,
    supply,
    totalSupply,
    craftable,
  } = item;

  const { character } = useGame();

  const isEquipped =
    equippers.length > 0 &&
    equippers.some(equippedBy => equippedBy.characterId === holderId);

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
          {isConnectedAndMounted && isEquipped && (
            <>
              <HStack w="100%" spacing={4}>
                <Flex
                  borderRadius="50%"
                  w="1.5rem"
                  h="1.5rem"
                  top={2}
                  right={2}
                  bg="dark"
                  justify="center"
                  align="center"
                >
                  <CheckIcon color="white" w="0.75rem" />
                </Flex>
                <Text
                  fontSize="2xs"
                  textTransform="uppercase"
                  letterSpacing="2px"
                >
                  Equipped
                </Text>
              </HStack>
              <Divider borderColor="whiteAlpha.300" />
            </>
          )}
        </VStack>
        <SimpleGrid columns={{ base: 2, sm: 3 }} w="100%" spacing={3} mt="4">
          <ItemValue label="Item ID" value={itemId} />
          <ItemValue
            label="Held By"
            value={`${holders.length} character${
              holders.length !== 1 ? 's' : ''
            }`}
          />
          <ItemValue label="Soulbound?" value={soulbound ? 'Yes' : 'No'} />
          <ItemValue
            label="Item Supply"
            value={`${supply.toString()} / ${totalSupply.toString()}`}
          />
          <ItemValue
            label="Equipped By"
            value={`${equippers.length} character${
              equippers.length !== 1 ? 's' : ''
            }`}
          />
          <ItemValue label="Craftable?" value={craftable ? 'Yes' : 'No'} />
          {/* <ItemValue label="Required XP" value={requiredXp.toLocaleString()} />
          <ItemValue
            label="Can I Claim?"
            value={isConnected ? '?' : 'Wallet not connected'}
          />
          */}
        </SimpleGrid>
      </VStack>
      {isConnectedAndMounted && !!character && !dummy && (
        <ItemActionMenu item={item} variant="solid" />
      )}
    </VStack>
  );
};

export const ItemCardSmall: React.FC<ItemCardProps> = ({
  holderId,
  ...item
}) => {
  const isConnectedAndMounted = useIsConnectedAndMounted();

  const {
    description,
    equippers,
    holders,
    image,
    itemId,
    name,
    soulbound,
    supply,
    totalSupply,
    craftable,
  } = item;

  const { character } = useGame();

  const [showDetails, setShowDetails] = useState(false);

  const isEquipped =
    equippers.length > 0 &&
    equippers.some(equippedBy => equippedBy.characterId === holderId);

  return (
    <VStack h="100%" spacing={3} w="100%">
      <VStack
        borderRadius="md"
        bg="whiteAlpha.100"
        flexGrow={1}
        justify="space-between"
        p={{ base: 4, md: 6 }}
        spacing={3}
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
          {!isEquipped && (
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
          )}
          {showDetails && (
            <Text fontSize="xs" w="100%">
              {shortenText(description, 130)}
            </Text>
          )}
          {isConnectedAndMounted && isEquipped && (
            <>
              <HStack w="100%" spacing={4}>
                <Flex
                  align="center"
                  bg="dark"
                  borderRadius="50%"
                  h="1.5rem"
                  justify="center"
                  right={2}
                  top={2}
                  w="1.5rem"
                >
                  <CheckIcon color="white" w="0.75rem" />
                </Flex>
                <Text
                  fontSize="2xs"
                  letterSpacing="2px"
                  textTransform="uppercase"
                >
                  Equipped
                </Text>
              </HStack>
              <Divider borderColor="whiteAlpha.300" />
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
            </>
          )}
        </VStack>
        {showDetails && (
          <SimpleGrid columns={{ base: 2 }} mt="4" spacing={3} w="100%">
            <ItemValue label="Item ID" value={itemId} />
            <ItemValue
              label="Held By"
              value={`${holders.length} character${
                holders.length !== 1 ? 's' : ''
              }`}
            />
            <ItemValue label="Soulbound?" value={soulbound ? 'Yes' : 'No'} />
            <ItemValue
              label="Item Supply"
              value={`${supply.toString()} / ${totalSupply.toString()}`}
            />
            <ItemValue
              label="Equipped By"
              value={`${equippers.length} character${
                equippers.length !== 1 ? 's' : ''
              }`}
            />
            <ItemValue label="Craftable?" value={craftable ? 'Yes' : 'No'} />
            {/*
            <ItemValue
              label="Required XP"
              value={requiredXp.toLocaleString()}
            />
          <ItemValue
            label="Can I Claim?"
            value={isConnected ? '?' : 'Wallet not connected'}
          />
          */}
          </SimpleGrid>
        )}
      </VStack>
      {isConnectedAndMounted && !!character && (
        <ItemActionMenu item={item} variant="solid" />
      )}
    </VStack>
  );
};

const ItemValue: React.FC<{ label: string; value: string }> = ({
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

export const ItemsTable: React.FC<{
  items: Item[];
}> = ({ items }) => {
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
            <Th>Supply</Th>
          </Tr>
        </Thead>
        <Tbody>
          {items.map(item => (
            <Tr key={item.id}>
              {isConnectedAndMounted && (
                <Td>
                  <ItemActionMenu item={item} size="xs" variant="solid" />
                </Td>
              )}
              <Td minH="60px">{item.itemId}</Td>
              <Td alignItems="center" display="flex" gap={4} w="240px">
                <Image alt={item.name} h="40px" src={item.image} />
                <Text>{shortenText(item.name, 20)}</Text>
              </Td>
              <Td>
                <Text fontSize="xs">{shortenText(item.description, 20)}</Text>
              </Td>
              <Td>{item.holders.length}</Td>
              <Td>
                {item.supply.toString()} / {item.totalSupply.toString()}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};
