import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Button,
  Flex,
  HStack,
  Heading,
  Image,
  Link,
  SimpleGrid,
  Spinner,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
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
import { shortenAddress, shortenText } from '@/utils/helpers';

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
  const [activeTab, setActiveTab] = useState<
    'characters' | 'xp' | 'classes' | 'items'
  >('characters');

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
      experience,
      image,
      name,
      id,
      description,
      characters,
      classes,
      items,
      masters,
    } = game;
    const chainId = DEFAULT_CHAIN.id;

    return (
      <VStack as="main" maxW="80vw" mx="auto" bg='blackAlpha.500' mt='14' mb='20' rounded={'5px'}>
        <HStack w="100%" align='start' justify="space-between" spacing={16}  p={12}>
          <VStack align="stretch">
          <VStack w="100%" justify='start' align='start' spacing={0} pt={2}>
            <Heading
              variant='noShadow'
              fontSize='5xl'>
                {name}
            </Heading>

            <Link
              alignItems="center"
              color="white"
              display="flex"
              _hover={{
                color: 'primary.500',
                cursor: 'pointer',
              }}
              fontSize="sm"
              gap={2}
              href={`${EXPLORER_URLS[chainId]}/address/${id}`}
              isExternal
            >
              {shortenAddress(id)}
              <Image
                alt="link to new tab"
                height="14px"
                src="/icons/external-link.svg"
                width="14px"
              />
            </Link>

          </VStack>

            {/* <Text as="span" fontSize="xs">
              {shortenText(description, 130)}
            </Text> */}
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





            
              <VStack px={14} pb={10} w='full' align="start" spacing={4}>
              <Text fontSize='sm' color='gray.500'>GameMasters</Text>

                {masters.map(master => (
                  <Link
                    alignItems="center"
                    display="flex"
                    fontSize="sm"
                    justifyContent="center"
                    href={`${EXPLORER_URLS[chainId]}/address/${master}`}
                    key={`gm-${master}`}
                    isExternal
                    p={0}
                  >
                    {master}
                  </Link>
                ))}
              </VStack>



        {!isConnectedAndMounted && (
          <Text align="center">Connect wallet to play this game.</Text>
        )}
        
        {isConnectedAndMounted && character && (
          <VStack px={14} w='full' align='start' justify='start'>
          <Text fontSize='sm' color='gray.500' textAlign='left'>Your character</Text>
          <CharacterCard chainId={chainId} character={character} />
          </VStack>
        )}
       

<Tabs w='full' borderColor='whiteAlpha.300' colorScheme='white' >
  <TabList px='10'>
    <Tab>
      <Image
          alt="users"
          height="20px"
          src="/icons/users.svg"
          width="20px"
        />
        <Text fontSize="xl" ml='2' mb='1'>
        {characters.length} characters
        </Text>
    </Tab>
    <Tab>
      <Image
          alt="xp"
          height="20px"
          src="/icons/xp.svg"
          width="20px"
        />
      <Text fontSize="xl" ml='2' mb='1'>
        {experience} XP
      </Text>
    </Tab>
    <Tab>
      <Image
          alt="users"
          height="20px"
          src="/icons/users.svg"
          width="20px"
        />
      <Text fontSize="xl" ml='2' mb='1'>
        {classes.length} classes
      </Text>
    </Tab>
    <Tab>
      <Image
          alt="items"
          height="20px"
          src="/icons/items.svg"
          width="20px"
        />
      <Text fontSize="xl" ml='2' mb='1'>
        {items.length} Items
      </Text>
    </Tab>

  </TabList>

  <TabPanels>
    <TabPanel>
      <CharactersPanel />
    </TabPanel>
    <TabPanel>
      <XPPanel />
    </TabPanel>
    <TabPanel>
      <ClassesPanel />
    </TabPanel>
    <TabPanel>
      <ItemsPanel />
    </TabPanel>
  </TabPanels>
</Tabs>





{/* 
        <SimpleGrid columns={2} spacing={4} w="100%">
          <Button
            border="3px solid black"
            onClick={() => setActiveTab('characters')}
            p={4}
            variant={activeTab === 'characters' ? 'solid' : 'outline'}
            w="100%"
          >
            <Text>{characters.length} Characters</Text>
          </Button>
          <Button
            border="3px solid black"
            onClick={() => setActiveTab('xp')}
            p={4}
            variant={activeTab === 'xp' ? 'solid' : 'outline'}
            w="100%"
          >
            <Text>{experience} XP</Text>
          </Button>
          <Button
            border="3px solid black"
            onClick={() => setActiveTab('classes')}
            p={4}
            variant={activeTab === 'classes' ? 'solid' : 'outline'}
            w="100%"
          >
            <Text>{classes.length} Classes</Text>
          </Button>
          <Button
            border="3px solid black"
            onClick={() => setActiveTab('items')}
            p={4}
            variant={activeTab === 'items' ? 'solid' : 'outline'}
            w="100%"
          >
            <Text>{items.length} Items</Text>
          </Button>
        </SimpleGrid>
        {activeTab === 'characters' && <CharactersPanel />}
        {activeTab === 'xp' && <XPPanel />}
        {activeTab === 'classes' && <ClassesPanel />}
        {activeTab === 'items' && <ItemsPanel />} */}
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
