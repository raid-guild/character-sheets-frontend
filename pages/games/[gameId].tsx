import {
  Button,
  Flex,
  Heading,
  HStack,
  Image,
  Link,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { isAddress } from 'viem';
import { useAccount } from 'wagmi';

import { CharacterCard } from '@/components/CharacterCard';
import { CharactersPanel } from '@/components/CharactersPanel';
import { ClassesPanel } from '@/components/ClassesPanel';
import { ItemsPanel } from '@/components/ItemsPanel';
import { AssignClassModal } from '@/components/Modals/AssignClassModal';
import { DropExperienceModal } from '@/components/Modals/DropExperienceModal';
import { EquipItemModal } from '@/components/Modals/EquipItemModal';
import { GiveItemsModal } from '@/components/Modals/GiveItemsModal';
import { JailPlayerModal } from '@/components/Modals/JailPlayerModal';
import { JoinGameModal } from '@/components/Modals/JoinGameModal';
import { RemoveCharacterModal } from '@/components/Modals/RemoveCharacterModal';
import { RenounceCharacterModal } from '@/components/Modals/RenounceCharacterModal';
import { RevokeClassModal } from '@/components/Modals/RevokeClassModal';
import { UpdateCharacterMetadataModal } from '@/components/Modals/UpdateCharacterMetadataModal';
import { UpdateGameMetadataModal } from '@/components/Modals/UpdateGameMetadataModal';
import { XPPanel } from '@/components/XPPanel';
import { ActionsProvider, useActions } from '@/contexts/ActionsContext';
import { GameProvider, useGame } from '@/contexts/GameContext';
import { DEFAULT_CHAIN } from '@/lib/web3';
import { EXPLORER_URLS } from '@/utils/constants';
import { shortenAddress } from '@/utils/helpers';

export default function GamePageOuter(): JSX.Element {
  const {
    query: { gameId },
    push,
    isReady,
  } = useRouter();

  useEffect(() => {
    if (
      isReady &&
      (!gameId || typeof gameId !== 'string' || !isAddress(gameId))
    ) {
      push('/');
    }
  }, [gameId, isReady, push]);

  return (
    <GameProvider gameId={gameId}>
      <ActionsProvider>
        <GamePage />
      </ActionsProvider>
    </GameProvider>
  );
}

function GamePage(): JSX.Element {
  const { game, character, isMaster, loading } = useGame();
  const {
    assignClassModal,
    editCharacterModal,
    equipItemModal,
    giveExpModal,
    giveItemsModal,
    jailPlayerModal,
    removeCharacterModal,
    renounceCharacterModal,
    revokeClassModal,
  } = useActions();
  const { isConnected } = useAccount();

  const joinGameModal = useDisclosure();
  const updateGameMetadata = useDisclosure();

  const [isConnectedAndMounted, setIsConnectedAndMounted] = useState(false);

  useEffect(() => {
    if (isConnected) {
      setIsConnectedAndMounted(true);
    } else {
      setIsConnectedAndMounted(false);
    }
  }, [isConnected]);

  const content = () => {
    if (loading) {
      return (
        <VStack as="main" pt={20}>
          <Spinner size="lg" />
        </VStack>
      );
    }

    if (!game) {
      return (
        <VStack as="main" pt={20}>
          <Text align="center">Game not found.</Text>
        </VStack>
      );
    }

    const {
      description,
      experience,
      image,
      name,
      id,
      characters,
      classes,
      items,
      masters,
    } = game;

    const chainId = DEFAULT_CHAIN.id;

    return (
      <VStack as="main" maxW="70vw" mb={20} mt={14} mx="auto">
        <HStack
          align="start"
          justify="space-between"
          py={12}
          px={14}
          spacing={16}
          w="100%"
        >
          <VStack align="stretch">
            <VStack align="start" justify="start" spacing={4} w="100%">
              <Heading fontSize="4xl" variant="primary">
                {name}
              </Heading>
              <Text>{description}</Text>
              <Link
                alignItems="center"
                color="blue"
                display="flex"
                fontSize="sm"
                gap={2}
                href={`${EXPLORER_URLS[chainId]}/address/${id}`}
                isExternal
              >
                {shortenAddress(id)}
                <Image
                  alt="link to new tab"
                  height="14px"
                  src="/icons/new-tab.svg"
                  width="14px"
                />
              </Link>
            </VStack>
            {isConnectedAndMounted && !character && (
              <Button onClick={joinGameModal.onOpen}>Join this Game</Button>
            )}

            {isMaster && (
              <Button onClick={updateGameMetadata.onOpen} size="sm">
                <Flex align="center" gap={2}>
                  <Image
                    alt="edit"
                    height="14px"
                    src="/icons/edit.svg"
                    width="14px"
                  />
                  Edit
                </Flex>
              </Button>
            )}
          </VStack>
          <Image
            alt="game emblem"
            background="gray.400"
            h="140px"
            objectFit="cover"
            src={image}
          />
        </HStack>

        <VStack align="start" pb={10} px={14} w="full">
          <Text fontSize="lg" fontWeight="bold">
            GameMasters
          </Text>

          {masters.map(master => (
            <Link
              alignItems="center"
              color="blue"
              display="flex"
              fontSize="sm"
              gap={2}
              href={`${EXPLORER_URLS[chainId]}/address/${id}`}
              isExternal
              key={`gm-${master}`}
            >
              {master}
              <Image
                alt="link to new tab"
                height="14px"
                src="/icons/new-tab.svg"
                width="14px"
              />
            </Link>
          ))}
        </VStack>

        {!isConnectedAndMounted && (
          <Text align="center">Connect wallet to play this game.</Text>
        )}

        {isConnectedAndMounted && character && (
          <VStack px={14} w="full" align="start" justify="start">
            <Text fontSize="lg" fontWeight="bold">
              Your character
            </Text>
            <CharacterCard chainId={chainId} character={character} />
          </VStack>
        )}

        <Tabs borderColor="white" colorScheme="white" mt={10} px={14} w="full">
          <TabList>
            <Tab gap={2}>
              <Image
                alt="users"
                height="20px"
                src="/icons/users.svg"
                width="20px"
              />
              <Text>{characters.length} characters</Text>
            </Tab>
            <Tab gap={2}>
              <Image alt="xp" height="20px" src="/icons/xp.svg" width="20px" />
              <Text>{experience} XP</Text>
            </Tab>
            <Tab gap={2}>
              <Image
                alt="users"
                height="20px"
                src="/icons/users.svg"
                width="20px"
              />
              <Text>{classes.length} classes</Text>
            </Tab>
            <Tab gap={2}>
              <Image
                alt="items"
                height="20px"
                src="/icons/items.svg"
                width="20px"
              />
              <Text>{items.length} Items</Text>
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel px={0}>
              <CharactersPanel />
            </TabPanel>
            <TabPanel px={0}>
              <XPPanel />
            </TabPanel>
            <TabPanel px={0}>
              <ClassesPanel />
            </TabPanel>
            <TabPanel px={0}>
              <ItemsPanel />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    );
  };

  return (
    <>
      {content()}
      <JoinGameModal {...joinGameModal} />
      <UpdateGameMetadataModal {...updateGameMetadata} />

      {assignClassModal && <AssignClassModal />}
      {editCharacterModal && <UpdateCharacterMetadataModal />}
      {equipItemModal && <EquipItemModal />}
      {giveExpModal && <DropExperienceModal />}
      {giveItemsModal && <GiveItemsModal />}
      {jailPlayerModal && <JailPlayerModal />}
      {removeCharacterModal && <RemoveCharacterModal />}
      {renounceCharacterModal && <RenounceCharacterModal />}
      {revokeClassModal && <RevokeClassModal />}
    </>
  );
}
