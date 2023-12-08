import {
  AspectRatio,
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  IconButton,
  Image,
  Link,
  Spinner,
  Text,
  VStack,
  Wrap,
} from '@chakra-ui/react';
import { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from 'next';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { isAddress } from 'viem';

import { CharacterCard } from '@/components/CharacterCard';
import { CharactersPanel } from '@/components/CharactersPanel';
import { EditCharacter } from '@/components/EditCharacter';
import { GameActions } from '@/components/GameActions';
import { GameTotals } from '@/components/GameTotals';
import { ImplementationsAlert } from '@/components/ImplementationsAlert';
import { JoinGame } from '@/components/JoinGame';
import { AddGameMasterModal } from '@/components/Modals/AddGameMasterModal';
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
import { RenounceCharacterModal } from '@/components/Modals/RenounceCharacterModal';
import { RenounceClassModal } from '@/components/Modals/RenounceClassModal';
import { RestoreCharacterModal } from '@/components/Modals/RestoreCharacterModal';
import { RevokeClassModal } from '@/components/Modals/RevokeClassModal';
import { TransferCharacterModal } from '@/components/Modals/TransferCharacterModal';
import { UpdateGameMetadataModal } from '@/components/Modals/UpdateGameMetadataModal';
import { NetworkAlert } from '@/components/NetworkAlert';
import { NetworkDisplay } from '@/components/NetworkDisplay';
import { OldCharacterURIAlert } from '@/components/OldCharacterURIAlert';
import { UserLink } from '@/components/UserLink';
import {
  CharacterActionsProvider,
  useCharacterActions,
} from '@/contexts/CharacterActionsContext';
import {
  ClassActionsProvider,
  useClassActions,
} from '@/contexts/ClassActionsContext';
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
import { getGameForChainId, getGamesForChainId } from '@/graphql/games';
import { useCheckGameNetwork } from '@/hooks/useCheckGameNetwork';
import { useIsConnectedAndMounted } from '@/hooks/useIsConnectedAndMounted';
import {
  getAddressUrl,
  getChainIdFromLabel,
  getChainLabelFromId,
  SUPPORTED_CHAINS,
} from '@/lib/web3';
import { shortenAddress } from '@/utils/helpers';

type Props = InferGetStaticPropsType<typeof getStaticProps>;

export default function GamePageOuter({ game }: Props): JSX.Element {
  const {
    query: { gameId, chainLabel },
    push,
    isReady,
  } = useRouter();

  const chainId = getChainIdFromLabel(chainLabel as string);

  useEffect(() => {
    if (
      isReady &&
      (!gameId || typeof gameId !== 'string' || !isAddress(gameId) || !chainId)
    ) {
      push('/');
    }
  }, [gameId, chainId, isReady, push]);

  const isConnectedAndMounted = useIsConnectedAndMounted();

  if (!gameId || !chainId) {
    return <></>;
  }

  return (
    <GameProvider chainId={chainId} gameId={gameId.toString()} game={game}>
      <GameActionsProvider>
        <CharacterActionsProvider>
          <ClassActionsProvider>
            <ItemActionsProvider>
              <ImplementationsAlert />
              {isConnectedAndMounted && <OldCharacterURIAlert />}
              {isConnectedAndMounted && <NetworkAlert chainId={chainId} />}
              <GamePage isConnectedAndMounted={isConnectedAndMounted} />
            </ItemActionsProvider>
          </ClassActionsProvider>
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
  const { game, character, isAdmin, loading, isEligibleForCharacter } =
    useGame();

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
    giveExpModal,
    giveItemsModal,
    jailPlayerModal,
    removeCharacterModal,
    renounceCharacterModal,
    renounceClassModal,
    revokeClassModal,
    showEditCharacter,
    transferCharacterModal,
  } = useCharacterActions();

  const { selectedClass } = useClassActions();

  const { equipItemModal, claimItemModal, editItemClaimableModal } =
    useItemActions();

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
      items,
      chainId,
    } = game;

    return (
      <Grid
        templateColumns={{ base: '1fr', lg: '3fr 1fr' }}
        gridGap="5px"
        w="100%"
      >
        <HStack spacing="5px">
          <HStack
            bg="cardBG"
            h="100%"
            px={{ base: 4, sm: 8 }}
            py={8}
            transition="background 0.3s ease"
            w="100%"
            spacing={12}
          >
            <AspectRatio
              ratio={1}
              w="100%"
              maxW="12rem"
              display={{ base: 'none', lg: 'block' }}
            >
              <Image
                alt="game emblem"
                objectFit="cover"
                src={image}
                w="100%"
                h="100%"
              />
            </AspectRatio>
            <VStack spacing={4} align="flex-start">
              <AspectRatio
                ratio={1}
                w="100%"
                maxW={{ base: '8rem', md: '12rem' }}
                display={{ base: 'block', lg: 'none' }}
              >
                <Image
                  alt="game emblem"
                  objectFit="cover"
                  src={image}
                  w="100%"
                  h="100%"
                />
              </AspectRatio>
              <Heading
                display="inline-block"
                fontSize={{ base: '32px', md: '40px' }}
                fontWeight="normal"
                lineHeight="40px"
                overflowWrap="break-word"
                wordBreak="break-word"
              >
                {name}
              </Heading>
              <Text
                fontSize="xl"
                fontWeight={200}
                mb={2}
                overflowWrap="break-word"
                wordBreak="break-word"
              >
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
              {isConnectedAndMounted && isAdmin && (
                <Button
                  onClick={() =>
                    openActionModal(GameMasterActions.UPDATE_GAME_METADATA)
                  }
                  size="sm"
                >
                  edit
                </Button>
              )}
            </VStack>
          </HStack>
          <VStack
            align="start"
            spacing={0}
            h="100%"
            bg="cardBG"
            flexShrink={0}
            p={8}
            display={{ base: 'none', lg: 'flex' }}
          >
            <GameTotals
              experience={experience}
              characters={characters}
              items={items}
            />
          </VStack>
        </HStack>
        <VStack
          align="start"
          spacing={0}
          h="100%"
          bg="cardBG"
          flexShrink={0}
          px={{ base: 4, sm: 8 }}
          py={8}
          display={{ base: 'flex', lg: 'none' }}
        >
          <GameTotals
            experience={experience}
            characters={characters}
            items={items}
          />
        </VStack>

        <VStack
          align="start"
          spacing={4}
          px={{ base: 4, sm: 8 }}
          py={8}
          bg="cardBG"
        >
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
            {isConnectedAndMounted && isAdmin && (
              <IconButton
                onClick={() =>
                  openActionModal(GameMasterActions.ADD_GAME_MASTER)
                }
                aria-label="add game master"
                variant="ghost"
                minW={4}
                icon={<Text>+</Text>}
                mb={1}
                ml={2}
              />
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
        {isConnectedAndMounted && (
          <GameActions display={{ base: 'flex', lg: 'none' }} />
        )}

        <VStack align="stretch" position="relative" spacing="5px">
          <Box ref={topOfCardRef} position="absolute" top="-80px" />
          {!isConnectedAndMounted && (
            <VStack p={8} bg="cardBG" align="start" spacing={4}>
              <Text fontSize="sm">
                Please connect your wallet to play this game.
              </Text>
            </VStack>
          )}

          {isConnectedAndMounted && (
            <VStack
              px={{ base: 4, sm: 8 }}
              py={8}
              bg="cardBG"
              align="start"
              spacing={4}
            >
              {!character && !showJoinGame && isEligibleForCharacter && (
                <HStack
                  flexDirection={{ base: 'column-reverse', md: 'row' }}
                  spacing={4}
                  w="100%"
                >
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
                <>
                  <Text
                    letterSpacing="3px"
                    fontSize="2xs"
                    textTransform="uppercase"
                    w="100%"
                    mb={2}
                  >
                    Your Character
                  </Text>
                  {showEditCharacter ? (
                    <EditCharacter topOfCardRef={topOfCardRef} />
                  ) : (
                    <CharacterCard chainId={chainId} character={character} />
                  )}
                </>
              )}
            </VStack>
          )}

          <VStack px={{ base: 4, sm: 8 }} py={8} bg="cardBG">
            <CharactersPanel />
          </VStack>
        </VStack>
        {isConnectedAndMounted && (
          <GameActions display={{ base: 'none', lg: 'flex' }} />
        )}
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
      {claimClassModal && (
        <ClaimClassModal classEntity={selectedClass ?? undefined} />
      )}
      {equipItemModal && <EquipItemModal />}
      {giveExpModal && <DropExperienceModal />}
      {giveItemsModal && <GiveItemsModal />}
      {jailPlayerModal && <JailPlayerModal />}
      {removeCharacterModal && <RemoveCharacterModal />}
      {renounceCharacterModal && <RenounceCharacterModal />}
      {renounceClassModal && (
        <RenounceClassModal classEntity={selectedClass ?? undefined} />
      )}
      {revokeClassModal && <RevokeClassModal />}
      {transferCharacterModal && <TransferCharacterModal />}

      {/*  ITEM ACTIONS */}
      {claimItemModal && <ClaimItemModal />}
      {editItemClaimableModal && <EditItemClaimableModal />}
    </>
  );
}

type QueryParams = { gameId: string; chainLabel: string };

export const getStaticPaths: GetStaticPaths = async () => {
  const paths: { params: QueryParams }[] = [];

  await Promise.all(
    SUPPORTED_CHAINS.map(async chain => {
      const chainLabel = getChainLabelFromId(chain.id);
      if (!chainLabel) {
        return;
      }
      const { games } = await getGamesForChainId(chain.id);

      paths.push(
        ...games.map(game => ({
          params: {
            chainLabel,
            gameId: game.id,
          },
        })),
      );
    }),
  );

  return { paths, fallback: true };
};

export const getStaticProps: GetStaticProps = async context => {
  const chainLabel = context.params?.chainLabel as string;
  const gameId = context.params?.gameId as string;
  const chainId = getChainIdFromLabel(chainLabel);
  const game =
    !!chainId && !!gameId ? await getGameForChainId(chainId, gameId) : null;

  return {
    props: {
      game,
    },
    revalidate: 60,
  };
};
