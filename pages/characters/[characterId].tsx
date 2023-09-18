import {
  Box,
  Button,
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
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { isAddress } from 'viem';
import { useAccount, useNetwork } from 'wagmi';

import { CharacterActionMenu } from '@/components/ActionMenus/CharacterActionMenu';
import { ClassTag, VillagerClassTag } from '@/components/ClassTag';
import { ItemTag } from '@/components/ItemTag';
import { AssignClassModal } from '@/components/Modals/AssignClassModal';
import { DropExperienceModal } from '@/components/Modals/DropExperienceModal';
import { EquipItemModal } from '@/components/Modals/EquipItemModal';
import { GiveItemsModal } from '@/components/Modals/GiveItemsModal';
import { UpdateCharacterMetadataModal } from '@/components/Modals/UpdateCharacterMetadataModal';
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
  const { pageCharacter, loading } = useGame();
  const { isConnected } = useAccount();
  const { chain } = useNetwork();
  const {
    assignClassModal,
    editCharacterModal,
    giveExpModal,
    giveItemsModal,
    equipItemModal,
  } = useActions();

  const [isConnectedAndMounted, setIsConnectedAndMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'transactions'>(
    'inventory',
  );

  useEffect(() => {
    if (isConnected) {
      setIsConnectedAndMounted(true);
    } else {
      setIsConnectedAndMounted(false);
    }
  }, [isConnected]);

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
    if (loading || !isConnectedAndMounted) {
      return (
        <VStack as="main" pt={20}>
          <Spinner size="lg" />
        </VStack>
      );
    }

    if (!pageCharacter) {
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
    } = pageCharacter;

    return (
      <VStack as="main" pt={10} pb={20} spacing={10} maxW="2xl" mx="auto">
        <HStack w="100%" justify="space-between" spacing={16}>
          <VStack align="stretch">
            <Text fontWeight="bold" fontSize="xl">
              {name}
            </Text>
            <Text as="span" fontSize="xs">
              {description}
            </Text>
            <Link
              alignItems="center"
              color="blue"
              display="flex"
              fontSize="sm"
              gap={2}
              href={`${EXPLORER_URLS[chainId]}/address/${account}`}
              isExternal
            >
              {shortenAddress(account)}
              <Image
                alt="link to new tab"
                h="14px"
                src="/icons/new-tab.svg"
                w="14px"
              />
            </Link>
            <Box w="100px">
              <CharacterActionMenu character={pageCharacter} />
            </Box>
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
          <Box pos="relative">
            <Image
              alt="character avatar"
              h="240px"
              minW="160px"
              objectFit="cover"
              src={image}
              w="160px"
            />
            <HStack
              bg="white"
              border="1px solid black"
              pos="absolute"
              right="0"
              bottom="0"
              px={1}
              fontSize="xs"
            >
              <Text>{experience} XP</Text>
            </HStack>
          </Box>
        </HStack>
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
          <VStack w="100%" align="stretch" spacing={4}>
            <Wrap>
              {items.map(item => (
                <WrapItem key={item.itemId}>
                  <ItemTag item={item} holderId={characterId} />
                </WrapItem>
              ))}
            </Wrap>
          </VStack>
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
