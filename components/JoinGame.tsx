import {
  Box,
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  HStack,
  Image,
  Input,
  SimpleGrid,
  Text,
  Textarea,
  useBreakpointValue,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Address, parseAbi, toHex } from 'viem';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';

import { CompositeCharacterImage } from '@/components/CompositeCharacterImage';
import { Switch } from '@/components/Switch';
import { TraitVariantControls } from '@/components/TraitVariantControls';
import { TransactionPending } from '@/components/TransactionPending';
import { XPDisplay, XPDisplaySmall } from '@/components/XPDisplay';
import { useGame } from '@/contexts/GameContext';
import { awaitSubgraphSync } from '@/graphql/sync';
import { useCharacterLimitMessage } from '@/hooks/useCharacterLimitMessage';
import { useToast } from '@/hooks/useToast';
import { useUploadFile } from '@/hooks/useUploadFile';
import {
  BaseTraitType,
  CharacterTraits,
  DEFAULT_TRAITS,
  EquippableTraitType,
  formatTraitsForUpload,
  TRAITS,
  TraitsArray,
} from '@/lib/traits';
import { getChainLabelFromId } from '@/lib/web3';
import { BASE_CHARACTER_URI } from '@/utils/constants';
import { shortenText } from '@/utils/helpers';
import { Attribute } from '@/utils/types';

type JoinGameProps = {
  onClose: () => void;
  topOfCardRef: React.RefObject<HTMLDivElement>;
};

export const JoinGame: React.FC<JoinGameProps> = ({
  onClose,
  topOfCardRef,
}) => {
  const { game, character, reload: reloadGame } = useGame();
  const { data: walletClient } = useWalletClient();
  const { chain } = useAccount();
  const publicClient = usePublicClient();
  const { renderError } = useToast();
  const useSmallXp = useBreakpointValue({ base: true, md: false });

  const {
    file: characterAvatar,
    setFile: setCharacterAvatar,
    onRemove,
    onUpload,
    isUploading,
    isUploaded,
  } = useUploadFile({ fileName: 'characterAvatar' });
  const [step, setStep] = useState<number>(0);

  const [characterName, setCharacterName] = useState<string>('');
  const [characterDescription, setCharacterDescription] = useState<string>('');
  const characterLimitMessage = useCharacterLimitMessage({
    characterLimit: 200,
    currentCharacterCount: characterDescription.length,
  });

  const [showUpload, setShowUpload] = useState<boolean>(false);
  const [traits, setTraits] = useState<TraitsArray>(DEFAULT_TRAITS);

  const [showError, setShowError] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txFailed, setTxFailed] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSynced, setIsSynced] = useState<boolean>(false);

  const invalidCharacterDescription = useMemo(() => {
    return characterDescription.length > 200 && !!characterDescription;
  }, [characterDescription]);

  const hasError = useMemo(() => {
    return (
      !characterDescription ||
      (showUpload && !characterAvatar) ||
      !characterName ||
      invalidCharacterDescription
    );
  }, [
    characterDescription,
    characterAvatar,
    characterName,
    invalidCharacterDescription,
    showUpload,
  ]);

  const resetData = useCallback(() => {
    setStep(0);
    setShowUpload(false);
    setTraits(DEFAULT_TRAITS);

    setCharacterName('');
    setCharacterDescription('');
    setCharacterAvatar(null);
    setShowError(false);

    setIsCreating(false);
    setTxHash(null);
    setTxFailed(false);
    setIsSyncing(false);
    setIsSynced(false);
  }, [setCharacterAvatar]);

  useEffect(() => {
    resetData();
  }, [resetData]);

  const onJoinCharacter = useCallback(
    async (e: React.FormEvent<HTMLDivElement>) => {
      e.preventDefault();

      if (hasError) {
        setShowError(true);
        return;
      }

      setIsCreating(true);

      try {
        if (!walletClient) throw new Error('Could not find a wallet client');
        if (!publicClient) throw new Error('Could not find a public client');
        if (!chain) throw new Error('Could not find a connected chain');
        if (!game) throw new Error('Missing game data');
        if (character) throw new Error('Character already exists');

        let attributes: Attribute[] | null = null;
        let cid = '';

        if (showUpload) {
          cid = await onUpload();
        } else {
          const traitsObject: CharacterTraits = {
            [BaseTraitType.BACKGROUND]: traits[0],
            [BaseTraitType.BODY]: traits[1],
            [BaseTraitType.EYES]: traits[2],
            [BaseTraitType.HAIR]: traits[3],
            [EquippableTraitType.EQUIPPED_ITEM_1]: '',
            [BaseTraitType.CLOTHING]: traits[5],
            [EquippableTraitType.EQUIPPED_WEARABLE]: '',
            [BaseTraitType.MOUTH]: traits[6],
            [EquippableTraitType.EQUIPPED_ITEM_2]: '',
            [EquippableTraitType.EQUIPPED_ITEM_3]: '',
          };

          const traitsArray = await formatTraitsForUpload(traitsObject);
          if (!traitsArray)
            throw new Error('Something went wrong uploading your character');

          const response = await fetch(`/api/uploadTraits`, {
            method: 'POST',
            body: JSON.stringify({
              traitsArray,
              traitsObject,
            }),
          });

          if (!response.ok)
            throw new Error(
              'Something went wrong uploading your character avatar',
            );

          const { attributes: _attributes, cid: _cid } = await response.json();
          attributes = _attributes;
          cid = _cid;
        }

        if (!cid)
          throw new Error(
            'Something went wrong uploading your character avatar',
          );

        const characterMetadata: {
          name: string;
          description: string;
          image: string;
          attributes?: {
            trait_type: string;
            value: string;
          }[];
        } = {
          name: characterName,
          description: characterDescription,
          image: `ipfs://${cid}`,
          attributes: [],
        };

        if (!showUpload && attributes) {
          characterMetadata['attributes'] = attributes;
        }

        const { baseTokenURI } = game;
        const chainLabel = getChainLabelFromId(game.chainId);
        const baseCharacterUri = `${BASE_CHARACTER_URI}${chainLabel}/`;

        let characterTokenUri = '';
        if (baseTokenURI === baseCharacterUri) {
          const totalSheets = game.characters.length;
          const characterId = `${game.id}-character-${toHex(totalSheets + 1)}`;
          const apiRoute = `/api/characters/${chainLabel}/${characterId}/update`;
          const signature = await walletClient.signMessage({
            message: apiRoute,
            account: walletClient.account?.address as Address,
          });

          const res = await fetch(apiRoute, {
            headers: {
              'x-account-address': walletClient.account?.address as Address,
              'x-account-signature': signature,
              'x-account-chain-id': walletClient.chain.id.toString(),
            },
            method: 'POST',
            body: JSON.stringify(characterMetadata),
          });
          if (!res.ok)
            throw new Error(
              "Something went wrong updating your character's metadata",
            );

          const { name, description, image } = await res.json();
          if (!(name && description && image))
            throw new Error(
              'Something went wrong updating your character metadata',
            );

          characterTokenUri = characterId;
        } else {
          const res = await fetch(
            '/api/uploadMetadata?name=characterMetadata.json',
            {
              method: 'POST',
              body: JSON.stringify(characterMetadata),
            },
          );

          if (!res.ok)
            throw new Error(
              'Something went wrong uploading your character metadata',
            );

          const { cid: characterMetadataCid } = await res.json();

          if (!characterMetadataCid)
            throw new Error(
              'Something went wrong uploading your character metadata',
            );

          characterTokenUri = characterMetadataCid;
        }

        const transactionhash = await walletClient.writeContract({
          chain: walletClient.chain,
          account: walletClient.account?.address as Address,
          address: game.id as Address,
          abi: parseAbi([
            'function rollCharacterSheet(address player, string calldata _tokenUri) external',
          ]),
          functionName: 'rollCharacterSheet',
          args: [walletClient.account?.address as Address, characterTokenUri],
        });
        setTxHash(transactionhash);

        const { blockNumber, status } =
          await publicClient.waitForTransactionReceipt({
            hash: transactionhash,
          });

        if (status === 'reverted') {
          setTxFailed(true);
          setIsCreating(false);
          throw new Error('Transaction failed');
        }

        setIsSyncing(true);
        const synced = await awaitSubgraphSync(
          publicClient.chain.id,
          blockNumber,
        );

        if (!synced) throw new Error('Something went wrong while syncing');

        setIsSynced(true);
        reloadGame();
      } catch (e) {
        renderError(e, 'Something went wrong creating your character');
      } finally {
        setIsSyncing(false);
        setIsCreating(false);
      }
    },
    [
      chain,
      character,
      characterDescription,
      characterName,
      game,
      hasError,
      onUpload,
      publicClient,
      showUpload,
      traits,
      reloadGame,
      renderError,
      walletClient,
    ],
  );

  const onSetStep = useCallback(
    (newStep: number) => {
      if (newStep === 1) {
        if (hasError) {
          setShowError(true);
          return;
        }
        setShowError(false);
      }

      setStep(newStep);
      topOfCardRef?.current?.scrollIntoView({
        behavior: 'smooth',
      });
    },
    [hasError, topOfCardRef],
  );

  const isLoading = isCreating;
  const isDisabled = isLoading || isUploading;

  if (txFailed) {
    return (
      <VStack py={10} spacing={4} w="100%">
        <Text>Transaction failed.</Text>
        <Button onClick={onClose} variant="ghost">
          continue
        </Button>
      </VStack>
    );
  }

  if (isSynced) {
    return (
      <VStack py={10} spacing={4} w="100%">
        <Text>Your character was successfully created!</Text>
        <Button onClick={onClose} variant="ghost">
          continue
        </Button>
      </VStack>
    );
  }

  if (txHash) {
    return (
      <VStack py={10} w="100%">
        <TransactionPending
          isSyncing={isSyncing}
          text="Your character is being created."
          txHash={txHash}
          chainId={game?.chainId}
        />
      </VStack>
    );
  }

  return (
    <VStack as="form" onSubmit={onJoinCharacter} spacing={8} w="100%">
      <Flex justify="space-between" w="100%">
        <Text fontSize="sm" textTransform="uppercase">
          Character creation - {step === 2 ? 'preview' : `${step + 1} / 2`}
        </Text>
        <Button onClick={onClose} size="sm" variant="ghost">
          cancel
        </Button>
      </Flex>
      {step === 0 && (
        <VStack
          pl={{ base: 0, md: 6 }}
          pr={{ base: 0, md: 20 }}
          spacing={8}
          w="100%"
        >
          <FormControl isInvalid={showError && !characterName}>
            <FormLabel>Choose a name for your character</FormLabel>
            <Input
              onChange={e => setCharacterName(e.target.value)}
              type="text"
              value={characterName}
            />
            {showError && !characterName && (
              <FormHelperText color="red">
                A character name is required
              </FormHelperText>
            )}
          </FormControl>
          <FormControl isInvalid={showError && !characterDescription}>
            <FormLabel>
              Write a description for your character ({characterLimitMessage})
            </FormLabel>
            <Textarea
              onChange={e => setCharacterDescription(e.target.value)}
              value={characterDescription}
            />
            {showError && !characterDescription && (
              <FormHelperText color="red">
                A character description is required
              </FormHelperText>
            )}
            {showError && invalidCharacterDescription && (
              <FormHelperText color="red">
                Character description must be less than 200 characters
              </FormHelperText>
            )}
          </FormControl>
        </VStack>
      )}

      {step === 1 && (
        <VStack
          pl={{ base: 0, md: 6 }}
          pr={{ base: 0, md: 8 }}
          spacing={8}
          w="100%"
        >
          <VStack alignItems="flex-start" w="100%">
            <Text>Want to upload your own avatar image?</Text>
            <Text fontSize="xs">
              Uploading your own avatar prevents visual rendering of equipped
              items in the future.
            </Text>
            <Switch
              isChecked={showUpload}
              onChange={() => setShowUpload(!showUpload)}
            />
          </VStack>
          {showUpload && (
            <FormControl isInvalid={showError && !characterAvatar}>
              <FormLabel>Character Avatar</FormLabel>
              {!characterAvatar && (
                <Input
                  accept=".png, .jpg, .jpeg, .svg"
                  disabled={isUploading}
                  onChange={e =>
                    setCharacterAvatar(e.target.files?.[0] ?? null)
                  }
                  type="file"
                  variant="file"
                />
              )}
              {characterAvatar && (
                <Flex
                  align="center"
                  flexDir={{ base: 'column', md: 'row' }}
                  gap={10}
                  mt={4}
                >
                  <Image
                    alt="character avatar"
                    objectFit="contain"
                    src={URL.createObjectURL(characterAvatar)}
                    w="300px"
                  />
                  <Button
                    isDisabled={isUploading || isUploaded}
                    isLoading={isUploading}
                    loadingText="Uploading..."
                    mt={4}
                    onClick={!isUploaded ? onRemove : undefined}
                    type="button"
                    variant="outline"
                  >
                    {isUploaded ? 'Uploaded' : 'Remove'}
                  </Button>
                </Flex>
              )}
              {showError && !characterAvatar && (
                <FormHelperText color="red">
                  A character avatar is required
                </FormHelperText>
              )}
            </FormControl>
          )}
          {!showUpload && (
            <Flex
              flexDir={{ base: 'column-reverse', md: 'row' }}
              gap={12}
              w="100%"
            >
              <CompositeCharacterImage traits={traits} />
              <VStack w="100%">
                {traits.map((trait: string, i: number) => {
                  if (!trait) return null;
                  return (
                    <TraitVariantControls
                      index={i}
                      key={`trait-controls-${trait}`}
                      traits={traits}
                      setTraits={setTraits}
                      traitsByType={TRAITS[i]}
                    />
                  );
                })}
              </VStack>
            </Flex>
          )}
        </VStack>
      )}

      {step === 2 && (
        <SimpleGrid
          border="1px solid white"
          columns={{ base: 1, md: 2 }}
          maxW="72rem"
          p={6}
          spacing={10}
          w="100%"
        >
          <Box pos="relative">
            <CompositeCharacterImage traits={traits} />
            {useSmallXp ? (
              <HStack
                bottom={4}
                left="50%"
                pos="absolute"
                transform="translateX(-50%)"
              >
                <XPDisplaySmall experience="0" />
              </HStack>
            ) : (
              <HStack left={4} pos="absolute" top={4}>
                <XPDisplay experience="0" />
              </HStack>
            )}
          </Box>
          <VStack align="flex-start" spacing={6}>
            <Heading _hover={{ color: 'accent', cursor: 'pointer' }}>
              {characterName}
            </Heading>
            <Text fontSize="sm" fontWeight={300} lineHeight={5}>
              {shortenText(characterDescription, 100)}
            </Text>
            <HStack justify="space-between" w="full">
              <HStack spacing={4} align="center">
                <Image
                  alt="users"
                  height="20px"
                  src="/icons/items.svg"
                  width="20px"
                />
                <Text
                  fontSize="2xs"
                  letterSpacing="3px"
                  textTransform="uppercase"
                >
                  Inventory (0)
                </Text>
              </HStack>
            </HStack>
          </VStack>
        </SimpleGrid>
      )}

      {step === 0 && (
        <Flex justify="flex-end" w="100%">
          <Button
            mr={8}
            onClick={() => onSetStep(1)}
            size="sm"
            type="button"
            variant="solid"
          >
            {'>'} Next step
          </Button>
        </Flex>
      )}

      {step === 1 && (
        <Flex
          flexDir={{ base: 'column', md: 'row' }}
          gap={{ base: 2, md: 0 }}
          justify="space-between"
          w="100%"
        >
          <Button
            isDisabled={isDisabled}
            isLoading={isLoading}
            onClick={() => onSetStep(0)}
            size="sm"
            type="button"
            variant="outline"
          >
            Back to step 1
          </Button>
          <Flex flexDir={{ base: 'column', md: 'row' }} gap={4}>
            <Button
              isDisabled={isDisabled}
              isLoading={isLoading}
              onClick={() => onSetStep(2)}
              size="sm"
              type="button"
              variant="outline"
            >
              Preview
            </Button>
            <Button
              isDisabled={isDisabled}
              isLoading={isLoading}
              loadingText="Creating..."
              size="sm"
              type="submit"
              variant="solid"
            >
              Create
            </Button>
          </Flex>
        </Flex>
      )}

      {step === 2 && (
        <Flex
          flexDir={{ base: 'column', md: 'row' }}
          gap={{ base: 4, md: 0 }}
          justify="space-between"
          w="100%"
        >
          <Flex
            flexDir={{ base: 'column', md: 'row' }}
            gap={{ base: 2, md: 4 }}
          >
            <Button
              isDisabled={isDisabled}
              isLoading={isLoading}
              onClick={() => onSetStep(0)}
              size="sm"
              type="button"
              variant="outline"
            >
              Change info
            </Button>
            <Button
              isDisabled={isDisabled}
              isLoading={isLoading}
              onClick={() => onSetStep(1)}
              size="sm"
              type="button"
              variant="outline"
            >
              Change appearance
            </Button>
          </Flex>
          <Button
            isDisabled={isDisabled}
            isLoading={isLoading}
            loadingText="Creating..."
            size="sm"
            type="submit"
            variant="solid"
          >
            Create
          </Button>
        </Flex>
      )}
    </VStack>
  );
};
