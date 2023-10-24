import {
  AspectRatio,
  Box,
  Button,
  GridItem,
  Heading,
  HStack,
  Image,
  Link,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { isAddress } from 'viem';
import { useAccount, useNetwork } from 'wagmi';

import { CharacterActionMenu } from '@/components/ActionMenus/CharacterActionMenu';
import { ArrowBackIcon } from '@/components/ArrowBackIcon';
import { ClassTag } from '@/components/ClassTag';
import { ItemTag } from '@/components/ItemTag';
import { AssignClassModal } from '@/components/Modals/AssignClassModal';
import { DropExperienceModal } from '@/components/Modals/DropExperienceModal';
import { EquipItemModal } from '@/components/Modals/EquipItemModal';
import { GiveItemsModal } from '@/components/Modals/GiveItemsModal';
import { UpdateCharacterMetadataModal } from '@/components/Modals/UpdateCharacterMetadataModal';
import { XPDisplay } from '@/components/XPDisplay';
import { ActionsProvider, useActions } from '@/contexts/ActionsContext';
import { GameProvider, useGame } from '@/contexts/GameContext';
import { DEFAULT_CHAIN } from '@/lib/web3';
import { EXPLORER_URLS } from '@/utils/constants';
import { shortenAddress } from '@/utils/helpers';

export default function CharacterPageOuter(): JSX.Element {
  const {
    query: { characterId },
    push,
    isReady,
  } = useRouter();

  const gameId =
    typeof characterId === 'string' ? characterId?.split('-')[0] : '';

  useEffect(() => {
    if (
      isReady &&
      (!characterId || typeof characterId !== 'string' || !isAddress(gameId))
    ) {
      push('/');
    }
  }, [characterId, gameId, isReady, push]);

  return (
    <GameProvider gameId={gameId} characterId={characterId}>
      <ActionsProvider>
        <CharacterPage />
      </ActionsProvider>
    </GameProvider>
  );
}

function CharacterPage(): JSX.Element {
  const { game, pageCharacter, loading } = useGame();
  const { isConnected } = useAccount();
  const { chain } = useNetwork();
  const {
    assignClassModal,
    editCharacterModal,
    giveExpModal,
    giveItemsModal,
    equipItemModal,
  } = useActions();

  const [activeTab, setActiveTab] = useState<'inventory' | 'transactions'>(
    'inventory',
  );

  const chainId = chain?.id ?? DEFAULT_CHAIN.id;

  const items = useMemo(() => {
    const { equippedItems, heldItems } = pageCharacter ?? {};
    if (!(equippedItems && heldItems)) return [];
    const items = [...equippedItems];

    heldItems.forEach(item => {
      if (!items.find(i => i.itemId === item.itemId)) {
        items.push(item);
      }
    });

    return items;
  }, [pageCharacter]);

  const content = () => {
    if (loading) {
      return (
        <VStack as="main" pt={20}>
          <Spinner size="lg" />
        </VStack>
      );
    }

    if (!(pageCharacter && game)) {
      return (
        <VStack as="main" pt={20}>
          <Text align="center">Character not found.</Text>
        </VStack>
      );
    }

    const {
      account,
      characterId,
      classes,
      description,
      experience,
      image,
      name,
      jailed,
    } = pageCharacter;

    return (
      <VStack w="100%" spacing={10}>
        <Link
          alignItems="center"
          alignSelf="flex-start"
          as={NextLink}
          display="flex"
          gap={4}
          href={`/games/${game.id}`}
          size="sm"
          w="auto"
          _hover={{}}
        >
          <Button variant="ghost">
            <HStack>
              <ArrowBackIcon w="1.5rem" h="1.5rem" />
              <Text as="span">View {game.name}</Text>
            </HStack>
          </Button>
        </Link>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10} w="100%">
          <Box pos="relative" minW="25rem">
            <AspectRatio ratio={10 / 13} w="full">
              <Image
                alt="character avatar"
                filter={jailed ? 'grayscale(100%)' : 'none'}
                w="100%"
                h="100%"
                borderRadius="lg"
                objectFit="cover"
                src={image}
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
          <VStack align="start" spacing={4}>
            <Heading>{name}</Heading>
            <Link
              alignItems="center"
              display="flex"
              fontSize="sm"
              gap={2}
              href={`${EXPLORER_URLS[chainId]}/address/${account}`}
              isExternal
              textDecor="underline"
            >
              {shortenAddress(account)}
            </Link>
            <Wrap>
              {classes.map(classEntity => (
                <WrapItem key={classEntity.classId}>
                  <ClassTag {...classEntity} />
                </WrapItem>
              ))}
            </Wrap>
            <Text as="span" fontSize="xs">
              {description}
            </Text>
            {isConnected && (
              <Box>
                <CharacterActionMenu character={pageCharacter} />
              </Box>
            )}
          </VStack>
        </SimpleGrid>
        <SimpleGrid columns={2} spacing={4} w="100%">
          <Button
            border="3px solid black"
            onClick={() => setActiveTab('inventory')}
            p={4}
            variant={activeTab === 'inventory' ? 'solid' : 'outline'}
            w="100%"
          >
            <Text>Inventory ({items.length})</Text>
          </Button>
          <Button
            border="3px solid black"
            onClick={() => setActiveTab('transactions')}
            p={4}
            variant={activeTab === 'transactions' ? 'solid' : 'outline'}
            w="100%"
          >
            <Text>Transaction Log</Text>
          </Button>
        </SimpleGrid>
        {activeTab === 'inventory' && items.length > 0 && (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4} w="100%">
            {items.map(item => (
              <GridItem key={item.itemId}>
                <ItemTag item={item} holderId={characterId} />
              </GridItem>
            ))}
          </SimpleGrid>
        )}
        {activeTab === 'transactions' && <Text>Coming soon!</Text>}
      </VStack>
    );
  };

  return (
    <>
      {content()}
      {assignClassModal && <AssignClassModal />}
      {editCharacterModal && <UpdateCharacterMetadataModal />}
      {giveExpModal && <DropExperienceModal />}
      {giveItemsModal && <GiveItemsModal />}
      {equipItemModal && <EquipItemModal />}
    </>
  );
}
