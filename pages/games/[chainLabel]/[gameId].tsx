import {
  AspectRatio,
  Box,
  Button,
  Flex,
  Grid,
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
  VStack,
  Wrap,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { isAddress } from 'viem';
import { useAccount } from 'wagmi';

import { CharacterCard } from '@/components/CharacterCard';
import { CharactersPanel } from '@/components/CharactersPanel';
import { ClassesPanel } from '@/components/ClassesPanel';
import { GameTotals } from '@/components/GameTotals';
import { ItemsPanel } from '@/components/ItemsPanel';
import { JoinGame } from '@/components/JoinGame';
import { AddGameMasterModal } from '@/components/Modals/AddGameMasterModal';
import { AddItemRequirementModal } from '@/components/Modals/AddItemRequirementModal';
import { ApproveTransferModal } from '@/components/Modals/ApproveTransferModal';
import { AssignClassModal } from '@/components/Modals/AssignClassModal';
import { ClaimClassModal } from '@/components/Modals/ClaimClassModal';
import { ClaimItemModal } from '@/components/Modals/ClaimItemModal';
import { CreateClassModal } from '@/components/Modals/CreateClassModal';
import { CreateItemModal } from '@/components/Modals/CreateItemModal';
import { DropExperienceModal } from '@/components/Modals/DropExperienceModal';
import { EditItemClaimableModal } from '@/components/Modals/EditItemClaimableModal';
import { EquipItemModal } from '@/components/Modals/EquipItemModal';
import { GiveItemsModal } from '@/components/Modals/GiveItemsModal';
import { JailPlayerModal } from '@/components/Modals/JailPlayerModal';
import { RemoveCharacterModal } from '@/components/Modals/RemoveCharacterModal';
import { RemoveItemRequirementModal } from '@/components/Modals/RemoveItemRequirementModal';
import { RenounceCharacterModal } from '@/components/Modals/RenounceCharacterModal';
import { RenounceClassModal } from '@/components/Modals/RenounceClassModal';
import { RestoreCharacterModal } from '@/components/Modals/RestoreCharacterModal';
import { RevokeClassModal } from '@/components/Modals/RevokeClassModal';
import { TransferCharacterModal } from '@/components/Modals/TransferCharacterModal';
import { UpdateCharacterMetadataModal } from '@/components/Modals/UpdateCharacterMetadataModal';
import { UpdateGameMetadataModal } from '@/components/Modals/UpdateGameMetadataModal';
import { NetworkAlert } from '@/components/NetworkAlert';
import { NetworkDisplay } from '@/components/NetworkDisplay';
import { UserLink } from '@/components/UserLink';
import {
  CharacterActionsProvider,
  useCharacterActions,
} from '@/contexts/CharacterActionsContext';
import {
  GameActionsProvider,
  GameMasterActions,
  useGameActions,
} from '@/contexts/GameActionsContext';
import { GameProvider, useGame } from '@/contexts/GameContext';
import {
  ItemActionsProvider,
  useItemActions,
} from '@/contexts/ItemActionsContext';
import { useCheckGameNetwork } from '@/hooks/useCheckGameNetwork';
import { getAddressUrl, getChainIdFromLabel } from '@/lib/web3';
import { shortenAddress } from '@/utils/helpers';

export default function GamePageOuter(): JSX.Element {
  const {
    query: { gameId, chainLabel },
    push,
    isReady,
  } = useRouter();
  const { isConnected } = useAccount();
  const [isConnectedAndMounted, setIsConnectedAndMounted] = useState(false);

  const chainId = getChainIdFromLabel(chainLabel as string);

  useEffect(() => {
    if (
      isReady &&
      (!gameId || typeof gameId !== 'string' || !isAddress(gameId) || !chainId)
    ) {
      push('/');
    }
  }, [gameId, chainId, isReady, push]);

  useEffect(() => {
    if (isConnected) {
      setIsConnectedAndMounted(true);
    } else {
      setIsConnectedAndMounted(false);
    }
  }, [isConnected]);

  if (!gameId || !chainId) {
    return <></>;
  }

  return (
    <GameProvider chainId={chainId} gameId={gameId.toString()}>
      <GameActionsProvider>
        <CharacterActionsProvider>
          <ItemActionsProvider>
            {isConnectedAndMounted && <NetworkAlert chainId={chainId} />}
            <GamePage isConnectedAndMounted={isConnectedAndMounted} />
          </ItemActionsProvider>
        </CharacterActionsProvider>
      </GameActionsProvider>
    </GameProvider>
  );
}

function GamePage({
  isConnectedAndMounted,
}: {
  isConnectedAndMounted: boolean;
}): JSX.Element {
  const {
    game,
    character,
    isAdmin,
    isMaster,
    isOwner,
    loading,
    isEligibleForCharacter,
  } = useGame();

  const {
    addGameMasterModal,
    createItemModal,
    createClassModal,
    updateGameMetadataModal,
    restoreCharacterModal,
    openActionModal,
  } = useGameActions();

  const {
    assignClassModal,
    approveTransferModal,
    claimClassModal,
    editCharacterModal,
    equipItemModal,
    giveExpModal,
    giveItemsModal,
    jailPlayerModal,
    removeCharacterModal,
    renounceCharacterModal,
    renounceClassModal,
    revokeClassModal,
    transferCharacterModal,
  } = useCharacterActions();

  const {
    addRequirementModal,
    removeRequirementModal,
    claimItemModal,
    editItemClaimableModal,
  } = useItemActions();

  const [showJoinGame, setShowJoinGame] = useState(false);
  const { isWrongNetwork, renderNetworkError } = useCheckGameNetwork();

  const startJoinGame = useCallback(() => {
    if (isWrongNetwork) {
      renderNetworkError();
      return;
    }
    setShowJoinGame(true);
  }, [isWrongNetwork, renderNetworkError]);

  const topOfCardRef = useRef<HTMLDivElement>(null);

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
      owner,
      admins,
      masters,
      id,
      characters,
      classes,
      items,
      chainId,
    } = game;

    return (
      <Grid templateColumns="3fr 1fr" w="full" gridGap="5px">
        <HStack spacing="5px">
          <HStack
            bg="cardBG"
            h="100%"
            p={8}
            transition="background 0.3s ease"
            w="100%"
            spacing={12}
          >
            <AspectRatio ratio={1} w="100%" maxW="12rem">
              <Image
                alt="game emblem"
                objectFit="cover"
                src={image}
                w="100%"
                h="100%"
              />
            </AspectRatio>
            <VStack spacing={4} align="flex-start">
              <Heading
                display="inline-block"
                fontSize="40px"
                fontWeight="normal"
                lineHeight="40px"
              >
                {name}
              </Heading>
              <Text fontSize="xl" fontWeight={200} mb={2}>
                {description}
              </Text>
              <Link
                fontSize="sm"
                href={getAddressUrl(chainId, id)}
                isExternal
                fontWeight={300}
                mb={3}
                _hover={{}}
              >
                <HStack>
                  <Text textDecoration={'underline'}>{shortenAddress(id)}</Text>
                  <NetworkDisplay chainId={chainId} />
                </HStack>
              </Link>
              {isOwner ||
                isAdmin ||
                (isMaster && (
                  <Button
                    onClick={() =>
                      openActionModal(GameMasterActions.UPDATE_GAME_METADATA)
                    }
                    size="sm"
                  >
                    edit
                  </Button>
                ))}
            </VStack>
          </HStack>
          <VStack
            align="start"
            spacing={0}
            h="100%"
            bg="cardBG"
            flexShrink={0}
            p={8}
          >
            <GameTotals
              experience={experience}
              characters={characters}
              items={items}
            />
          </VStack>
        </HStack>

        <VStack align="start" spacing={4} p={8} bg="cardBG">
          <Text letterSpacing="3px" fontSize="2xs" textTransform="uppercase">
            Owner
          </Text>
          <UserLink user={owner} />

          <Text
            letterSpacing="3px"
            fontSize="2xs"
            textTransform="uppercase"
            mt={2}
          >
            Admins
          </Text>
          {admins.map(admin => (
            <UserLink key={`admin-${admin}`} user={admin} />
          ))}

          <Flex align="center" mt={2}>
            <Text letterSpacing="3px" fontSize="2xs" textTransform="uppercase">
              Game Masters
            </Text>
            {(isOwner || isAdmin) && (
              <Button
                onClick={() =>
                  openActionModal(GameMasterActions.ADD_GAME_MASTER)
                }
                variant="unstyled"
              >
                +
              </Button>
            )}
          </Flex>
          <Wrap spacingX={1}>
            {masters.map((master, i) => {
              return (
                <Flex key={`gm-${master}`}>
                  <UserLink user={master} />
                  {i !== masters.length - 1 && <Text as="span">, </Text>}
                </Flex>
              );
            })}
          </Wrap>
        </VStack>
        <VStack
          align="stretch"
          position="relative"
          ref={topOfCardRef}
          spacing="5px"
        >
          <Box ref={topOfCardRef} position="absolute" top="-80px" />
          {isConnectedAndMounted && (
            <VStack p={8} bg="cardBG" align="start" spacing={4}>
              {!character && !showJoinGame && isEligibleForCharacter && (
                <HStack w="100%" spacing={4}>
                  <Button variant="solid" onClick={startJoinGame}>
                    Join this Game
                  </Button>
                  <Text fontSize="sm">
                    You don’t have a character sheet in this game.
                  </Text>
                </HStack>
              )}
              {!character && showJoinGame && isEligibleForCharacter && (
                <JoinGame
                  onClose={() => setShowJoinGame(false)}
                  topOfCardRef={topOfCardRef}
                />
              )}
              {!character && !isEligibleForCharacter && (
                <HStack w="100%" spacing={4}>
                  <Text fontSize="sm">
                    You are not eligible to join this game.
                  </Text>
                </HStack>
              )}
              {character &&
                character.removed &&
                !character.jailed &&
                isEligibleForCharacter && (
                  <HStack spacing={4}>
                    <Button
                      variant="solid"
                      onClick={() =>
                        openActionModal(GameMasterActions.RESTORE_CHARACTER)
                      }
                    >
                      Restore Character
                    </Button>
                    <Text>Your character has been removed from this game.</Text>
                  </HStack>
                )}
              {character && character.jailed && (
                <Text>
                  Your character is in jail. You can’t play until you’re
                  released.
                </Text>
              )}
              {character && !character.removed && !character.jailed && (
                <CharacterCard chainId={chainId} character={character} />
              )}
            </VStack>
          )}

          <Tabs
            borderColor="transparent"
            colorScheme="white"
            w="full"
            p={8}
            bg="cardBG"
          >
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
                <ClassesPanel />
              </TabPanel>
              <TabPanel px={0}>
                <ItemsPanel />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
        <VStack h="100%" bg="cardBG" p={8} align="stretch" spacing={4}>
          {isMaster ? (
            <>
              <Button
                onClick={() => openActionModal(GameMasterActions.CREATE_ITEM)}
                size="sm"
              >
                Create Item
              </Button>
              <Button
                onClick={() => openActionModal(GameMasterActions.CREATE_CLASS)}
                size="sm"
              >
                Create Class
              </Button>
            </>
          ) : (
            <Text>Coming Soon!</Text>
          )}
        </VStack>
      </Grid>
    );
  };

  return (
    <>
      {content()}
      {/*  GAME ACTIONS */}
      {addGameMasterModal && <AddGameMasterModal />}
      {updateGameMetadataModal && <UpdateGameMetadataModal />}
      {restoreCharacterModal && <RestoreCharacterModal />}
      {createClassModal && <CreateClassModal />}
      {createItemModal && <CreateItemModal />}

      {/*  CHARACTER ACTIONS */}
      {approveTransferModal && <ApproveTransferModal />}
      {assignClassModal && <AssignClassModal />}
      {claimClassModal && <ClaimClassModal />}
      {editCharacterModal && <UpdateCharacterMetadataModal />}
      {equipItemModal && <EquipItemModal />}
      {giveExpModal && <DropExperienceModal />}
      {giveItemsModal && <GiveItemsModal />}
      {jailPlayerModal && <JailPlayerModal />}
      {removeCharacterModal && <RemoveCharacterModal />}
      {renounceCharacterModal && <RenounceCharacterModal />}
      {renounceClassModal && <RenounceClassModal />}
      {revokeClassModal && <RevokeClassModal />}
      {transferCharacterModal && <TransferCharacterModal />}

      {/*  ITEM ACTIONS */}
      {addRequirementModal && <AddItemRequirementModal />}
      {removeRequirementModal && <RemoveItemRequirementModal />}
      {claimItemModal && <ClaimItemModal />}
      {editItemClaimableModal && <EditItemClaimableModal />}
    </>
  );
}
