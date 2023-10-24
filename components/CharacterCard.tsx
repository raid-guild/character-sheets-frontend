import {
  Box,
  Button,
  HStack,
  Image,
  Link,
  Text,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useMemo } from 'react';
import { useAccount } from 'wagmi';

import { CharacterActionMenu } from '@/components/ActionMenus/CharacterActionMenu';
import { EXPLORER_URLS } from '@/utils/constants';
import { shortenAddress, shortenText } from '@/utils/helpers';
import { Character } from '@/utils/types';

import { ClassTag, VillagerClassTag } from './ClassTag';
import { ItemTag } from './ItemTag';

export const CharacterCard: React.FC<{
  chainId: number;
  character: Character;
}> = ({ chainId, character }) => {
  const { isConnected } = useAccount();

  const {
    id,
    characterId,
    account,
    classes,
    heldItems,
    equippedItems,
    description,
    experience,
    image,
    jailed,
    name,
  } = character;

  const items = useMemo(() => {
    const items = [...equippedItems];

    heldItems.forEach(item => {
      if (!items.find(i => i.itemId === item.itemId)) {
        items.push(item);
      }
    });

    return items;
  }, [equippedItems, heldItems]);

  return (
    <VStack
      border="3px solid black"
      borderBottom="5px solid black"
      borderRight="5px solid black"
      transition="background 0.3s ease"
      py={4}
      px={8}
      spacing={4}
      w="100%"
    >
      <HStack spacing={6} w="100%">
        <VStack>
          <Box pos="relative">
            <Image
              alt="character avatar"
              filter={jailed ? 'grayscale(100%)' : 'none'}
              w="120px"
              h="180px"
              objectFit="cover"
              src={image}
            />
            {jailed && (
              <Text
                bg="black"
                color="red"
                fontWeight="bold"
                left="50%"
                pos="absolute"
                top="50%"
                transform="translate(-50%, -50%)"
                variant="secondary"
              >
                JAILED
              </Text>
            )}
            <HStack
              bg="white"
              border="1px solid black"
              pos="absolute"
              right="0"
              bottom="0"
              px={1}
              fontSize="xs"
            >
              <Text color="black">{experience} XP</Text>
            </HStack>
          </Box>
          <VStack align="stretch" w="120px">
            <Button as={NextLink} href={`/characters/${id}`} size="sm" w="100%">
              View
            </Button>
            {isConnected && <CharacterActionMenu character={character} />}
          </VStack>
        </VStack>
        <VStack align="flex-start" flex={1}>
          <Text fontSize="lg" fontWeight="bold">
            {name}
          </Text>
          <Text fontSize="sm">{shortenText(description, 130)}</Text>
          <Link
            alignItems="center"
            color="blue"
            display="flex"
            fontSize="sm"
            gap={2}
            href={`${EXPLORER_URLS[chainId]}/address/${account}`}
            isExternal
            p={0}
          >
            {shortenAddress(account)}
            <Image
              alt="link to new tab"
              height="14px"
              src="/icons/new-tab.svg"
              width="14px"
            />
          </Link>
          <Text fontSize="xs">ID: {characterId}</Text>
          <Box background="black" h="3px" my={4} w={20} />
          <Text fontSize="sm">Classes:</Text>
          <Wrap>
            <WrapItem>
              <VillagerClassTag />
            </WrapItem>
            {classes.map(classEntity => (
              <WrapItem key={classEntity.classId}>
                <ClassTag classEntity={classEntity} />
              </WrapItem>
            ))}
          </Wrap>
        </VStack>
      </HStack>
      {items.length > 0 && (
        <VStack w="100%" align="stretch" spacing={4}>
          <Box background="black" h="3px" my={4} w="50%" />
          <Text fontSize="sm">Inventory:</Text>
          <Wrap>
            {items.map(item => (
              <WrapItem key={item.itemId}>
                <ItemTag item={item} holderId={characterId} />
              </WrapItem>
            ))}
          </Wrap>
        </VStack>
      )}
    </VStack>
  );
};

export const SmallCharacterCard: React.FC<{
  chainId: number;
  character: Character;
}> = ({ chainId, character }) => {
  const { isConnected } = useAccount();

  const {
    id,
    account,
    classes,
    characterId,
    description,
    equippedItems: items,
    experience,
    image,
    jailed,
    name,
  } = character;

  return (
    <VStack
      border="3px solid black"
      borderBottom="5px solid black"
      borderRight="5px solid black"
      transition="background 0.3s ease"
      p={4}
      spacing={5}
      w="100%"
    >
      <HStack spacing={5} w="100%">
        <VStack align="stretch" h="100%">
          <Box pos="relative">
            <Image
              alt="character avatar"
              filter={jailed ? 'grayscale(100%)' : 'none'}
              w="100px"
              h="150px"
              objectFit="cover"
              src={image}
            />
            {jailed && (
              <Text
                bg="black"
                color="red"
                fontWeight="bold"
                left="50%"
                pos="absolute"
                top="50%"
                transform="translate(-50%, -50%)"
                variant="secondary"
              >
                JAILED
              </Text>
            )}
            <HStack
              bg="white"
              border="1px solid black"
              pos="absolute"
              right="0"
              bottom="0"
              px={1}
              fontSize="2xs"
            >
              <Text color="black">{experience} XP</Text>
            </HStack>
          </Box>
          <VStack align="stretch" w="100px">
            <Button as={NextLink} href={`/characters/${id}`} size="sm" w="100%">
              View
            </Button>
            {isConnected && <CharacterActionMenu character={character} />}
          </VStack>
        </VStack>
        <VStack align="flex-start" flex={1}>
          <Text fontSize="md" fontWeight="bold">
            {name}
          </Text>
          <Text fontSize="xs">{shortenText(description, 130)}</Text>
          <Link
            alignItems="center"
            color="blue"
            display="flex"
            fontSize="sm"
            gap={2}
            href={`${EXPLORER_URLS[chainId]}/address/${account}`}
            isExternal
            p={0}
          >
            {shortenAddress(account)}
            <Image
              alt="link to new tab"
              height="14px"
              src="/icons/new-tab.svg"
              width="14px"
            />
          </Link>
          <Text fontSize="xs">ID: {characterId}</Text>
          <Box background="black" h="3px" my={2} w={20} />
          <Text fontSize="xs">Classes:</Text>
          <Wrap>
            <WrapItem>
              <VillagerClassTag size="sm" />
            </WrapItem>
            {classes.map(classEntity => (
              <WrapItem key={classEntity.classId}>
                <ClassTag classEntity={classEntity} size="sm" />
              </WrapItem>
            ))}
          </Wrap>
        </VStack>
      </HStack>
      {items.length > 0 && (
        <VStack w="100%" align="stretch" spacing={4}>
          <Box background="black" h="3px" my={2} w="50%" />
          <Text fontSize="xs">Equipped items:</Text>
          <Wrap>
            {items.map(item => (
              <WrapItem key={item.itemId}>
                <ItemTag holderId={characterId} item={item} size="sm" />
              </WrapItem>
            ))}
          </Wrap>
        </VStack>
      )}
    </VStack>
  );
};
