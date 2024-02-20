import {
  AspectRatio,
  Box,
  Button,
  Flex,
  GridItem,
  Heading,
  HStack,
  Image,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Text,
  Tooltip,
  useDisclosure,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useMemo } from 'react';
import { useAccount } from 'wagmi';

import { CharacterActionMenu } from '@/components/ActionMenus/CharacterActionMenu';
import { ItemsCatalogModal } from '@/components/Modals/ItemsCatalogModal';
import { useGame } from '@/contexts/GameContext';
import { useIsConnectedAndMounted } from '@/hooks/useIsConnectedAndMounted';
import { getAddressUrl, getChainLabelFromId } from '@/lib/web3';
import { JAILED_CHARACTER_IMAGE } from '@/utils/constants';
import { shortenAddress, shortenText } from '@/utils/helpers';
import { Character, Item } from '@/utils/types';

import { ClassTag } from './ClassTag';
import { ItemTag } from './ItemTag';
import { XPDisplay, XPDisplaySmall } from './XPDisplay';

export const CharacterCard: React.FC<{
  chainId: number;
  character: Character;
  displayOnly?: boolean;
}> = ({ chainId, character, displayOnly }) => {
  const { address } = useAccount();
  const { isMaster } = useGame();
  const itemsCatalogModal = useDisclosure();
  const isConnectedAndMounted = useIsConnectedAndMounted();

  const {
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
    const items: Item[] = [...equippedItems];

    heldItems.forEach(item => {
      if (!items.find(i => i.itemId === item.itemId)) {
        items.push(item);
      }
    });

    return items;
  }, [equippedItems, heldItems]);

  const itemTotal = useMemo(() => {
    return items
      .reduce((total, item) => total + BigInt(item.amount), BigInt(0))
      .toString();
  }, [items]);

  return (
    <SimpleGrid
      columns={{ base: 1, md: 2 }}
      spacing={10}
      w="100%"
      border="1px solid white"
      p={6}
      maxW="72rem"
    >
      <Box pos="relative">
        <AspectRatio ratio={10 / 13} h="100%" w="full">
          <Image
            alt="character avatar"
            filter={jailed ? 'grayscale(100%)' : 'none'}
            w="100%"
            h="100%"
            borderRadius="lg"
            objectFit="cover"
            objectPosition="center"
            src={jailed ? JAILED_CHARACTER_IMAGE : image}
          />
        </AspectRatio>
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
        <HStack pos="absolute" top={4} left={4}>
          <XPDisplay experience={experience} />
        </HStack>
      </Box>
      <VStack align="flex-start" spacing={6}>
        {displayOnly ? (
          <NextLink
            as={`/games/${getChainLabelFromId(
              character.chainId,
            )}/${character.gameId.toLowerCase()}`}
            href={`/games/[chainLabel]/[gameId]`}
            passHref
          >
            <Link _hover={{ textDecoration: 'none', color: 'accent' }}>
              <Heading>{name}</Heading>
            </Link>
          </NextLink>
        ) : (
          <Heading>{name}</Heading>
        )}
        <Text fontSize="xs">Character ID: {characterId}</Text>
        <Link
          alignItems="center"
          textDecor="underline"
          display="flex"
          fontSize="sm"
          gap={2}
          href={getAddressUrl(chainId, account)}
          isExternal
          p={0}
        >
          {shortenAddress(account)}
        </Link>
        <Wrap spacing={4}>
          {classes.length === 0 && (
            <Text fontSize="xs">No classes claimed</Text>
          )}
          {classes.map(classEntity => (
            <WrapItem key={classEntity.classId + classEntity.name}>
              <ClassTag {...classEntity} />
            </WrapItem>
          ))}
        </Wrap>
        <Text fontSize="sm" fontWeight={300} lineHeight={5}>
          {shortenText(description, 100)}
        </Text>
        {isConnectedAndMounted &&
          !displayOnly &&
          (isMaster || address?.toLowerCase() === character.player) && (
            <CharacterActionMenu character={character} variant="solid" />
          )}
        {items.length > 0 && (
          <>
            <HStack justify="space-between" w="full">
              <HStack spacing={4} align="center">
                <Image
                  alt="users"
                  height="20px"
                  src="/icons/items.svg"
                  width="20px"
                />
                <Text
                  letterSpacing="3px"
                  fontSize="2xs"
                  textTransform="uppercase"
                >
                  Inventory ({itemTotal})
                </Text>
              </HStack>
              {items.length > 2 && !displayOnly ? (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={itemsCatalogModal.onOpen}
                >
                  show all
                </Button>
              ) : (
                <NextLink
                  as={`/games/${getChainLabelFromId(
                    character.chainId,
                  )}/${character.gameId.toLowerCase()}`}
                  href={`/games/[chainLabel]/[gameId]`}
                  passHref
                >
                  <Button variant="ghost" size="xs">
                    show all
                  </Button>
                </NextLink>
              )}
            </HStack>
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4} w="full">
              {items.slice(0, 2).map(item => (
                <GridItem key={item.itemId + item.name}>
                  <ItemTag
                    item={item}
                    holderId={characterId}
                    displayOnly={displayOnly}
                  />
                </GridItem>
              ))}
            </SimpleGrid>
          </>
        )}
      </VStack>
      <ItemsCatalogModal
        character={character}
        isOpen={!!items.length && itemsCatalogModal.isOpen && !displayOnly}
        onClose={itemsCatalogModal.onClose}
      />
    </SimpleGrid>
  );
};

export const CharacterCardSmall: React.FC<{
  chainId: number;
  character: Character;
}> = ({ chainId, character }) => {
  const { address } = useAccount();
  const { isMaster } = useGame();
  const { isOpen, onClose, onOpen } = useDisclosure();

  const isConnectedAndMounted = useIsConnectedAndMounted();

  const { classes, experience, heldItems, image, jailed, name } = character;

  const itemTotal = useMemo(() => {
    return heldItems
      .reduce((total, item) => total + BigInt(item.amount), BigInt(0))
      .toString();
  }, [heldItems]);

  return (
    <VStack spacing={3} w="100%">
      <Box
        border="1px solid white"
        onClick={onOpen}
        overflow="hidden"
        p={3}
        transition="transform 0.3s"
        _hover={{
          cursor: 'pointer',
          transform: 'rotateY(15deg)',
        }}
        w="100%"
        h="100%"
      >
        <Box pos="relative">
          <AspectRatio ratio={10 / 13} w="full">
            <Image
              alt="character avatar"
              borderRadius="lg"
              filter={jailed ? 'grayscale(100%)' : 'none'}
              h="100%"
              objectFit="cover"
              src={jailed ? JAILED_CHARACTER_IMAGE : image}
              w="100%"
            />
          </AspectRatio>
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
            bottom={4}
            left="50%"
            pos="absolute"
            transform="translateX(-50%)"
          >
            <XPDisplaySmall experience={experience} />
          </HStack>
        </Box>
        <VStack py={4} spacing={5}>
          <Text fontSize="lg" fontWeight={500}>
            {name}
          </Text>
          <HStack justify="space-between" w="full">
            <Wrap spacing={2}>
              {classes.map(classEntity => (
                <WrapItem key={classEntity.classId + classEntity.name}>
                  <ClassTag {...classEntity} size="xs" />
                </WrapItem>
              ))}
            </Wrap>
            <Tooltip
              aria-label={`${itemTotal} item${
                Number(itemTotal) === 1 ? '' : 's'
              } in inventory`}
              label={`${itemTotal} item${
                Number(itemTotal) === 1 ? '' : 's'
              } in inventory`}
            >
              <Flex align="center" gap={3}>
                <Text>{itemTotal}</Text>
                <Image
                  alt="users"
                  height="16px"
                  src="/icons/items.svg"
                  width="16px"
                />
              </Flex>
            </Tooltip>
          </HStack>
        </VStack>
      </Box>
      {isConnectedAndMounted &&
        (isMaster || address?.toLowerCase() === character.player) && (
          <CharacterActionMenu character={character} variant="solid" />
        )}
      <Modal
        autoFocus={false}
        isOpen={isOpen}
        onClose={onClose}
        returnFocusOnClose={false}
      >
        <ModalOverlay />
        <ModalContent mt={{ base: 0, md: '84px' }}>
          <ModalHeader>
            <Text>Character: {name}</Text>
            <ModalCloseButton size="lg" />
          </ModalHeader>
          <ModalBody>
            <CharacterCard chainId={chainId} character={character} />
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  );
};
