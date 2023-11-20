import {
  AspectRatio,
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
  VStack,
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { parseAbi, toHex } from 'viem';
import { Address, useNetwork, usePublicClient, useWalletClient } from 'wagmi';

import { Switch } from '@/components/Switch';
import { TransactionPending } from '@/components/TransactionPending';
import { XPDisplay } from '@/components/XPDisplay';
import { useGame } from '@/contexts/GameContext';
import { waitUntilBlock } from '@/graphql/health';
import { useToast } from '@/hooks/useToast';
import { useUploadFile } from '@/hooks/useUploadFile';
import { getChainLabelFromId } from '@/lib/web3';
import { shortenText } from '@/utils/helpers';

import { getImageUrl, TRAITS, Traits, TraitType } from './traits';
import { TraitVariantControls } from './TraitVariantControls';

const DEFAULT_TRAITS: Traits = [
  '0_Clouds_a_64485b',
  '1_Type1_a_ccb5aa',
  '2_Type1_a_80a86c',
  '3_Bald_a_c5c3bb',
  '5_Villager1_a_796e68',
  '6_Basic_a',
];

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
  const { chain } = useNetwork();
  const publicClient = usePublicClient();
  const { renderError } = useToast();

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

  const [showUpload, setShowUpload] = useState<boolean>(false);
  const [traits, setTraits] = useState<Traits>(DEFAULT_TRAITS);
  const [isMerging, setIsMerging] = useState<boolean>(false);

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

  const mergeTraitImages = useCallback(async (): Promise<string> => {
    try {
      setIsMerging(true);

      const response = await fetch(`/api/uploadTraits`, {
        method: 'POST',
        body: JSON.stringify({
          traits,
        }),
      });

      if (!response.ok)
        throw new Error('Something went wrong uploading your character avatar');

      const { cid } = await response.json();
      return cid;
    } catch (e) {
      throw new Error('Something went wrong uploading your character avatar');
    } finally {
      setIsMerging(false);
    }
  }, [traits]);

  const onJoinCharacter = useCallback(
    async (e: React.FormEvent<HTMLDivElement>) => {
      e.preventDefault();

      if (hasError) {
        setShowError(true);
        return;
      }

      try {
        if (!walletClient) throw new Error('Could not find a wallet client');
        if (!chain) throw new Error('Could not find a connected chain');
        if (!game) throw new Error('Missing game data');
        if (character) throw new Error('Character already exists');

        let cid = '';

        if (showUpload) {
          cid = await onUpload();
        } else {
          cid = await mergeTraitImages();
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
        };

        if (!showUpload) {
          const attributes = traits.map((trait, i) => {
            const [, variant, color] = trait.split('_');
            const traitTypes = [
              TraitType.BACKGROUND,
              TraitType.BODY,
              TraitType.EYES,
              TraitType.HAIR,
              TraitType.CLOTHING,
              TraitType.MOUTH,
            ];
            return {
              trait_type: traitTypes[Number(i)],
              value: `${variant.toUpperCase()} ${color.toUpperCase()}`,
            };
          });
          characterMetadata['attributes'] = attributes;
        }

        setIsCreating(true);

        const totalSheets = await publicClient.readContract({
          address: game.id as Address,
          abi: parseAbi([
            'function totalSheets() external view returns(uint256)',
          ]),
          functionName: 'totalSheets',
        });
        const characterId = `${game.id}-character-${toHex(totalSheets)}`;
        const chainLabel = getChainLabelFromId(chain.id);
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

        const transactionhash = await walletClient.writeContract({
          chain: walletClient.chain,
          account: walletClient.account?.address as Address,
          address: game.id as Address,
          abi: parseAbi([
            'function rollCharacterSheet(string calldata _tokenUri) external',
          ]),
          functionName: 'rollCharacterSheet',
          args: [characterId],
        });
        setTxHash(transactionhash);

        const client = publicClient ?? walletClient;
        const { blockNumber, status } = await client.waitForTransactionReceipt({
          hash: transactionhash,
        });

        if (status === 'reverted') {
          setTxFailed(true);
          setIsCreating(false);
          throw new Error('Transaction failed');
        }

        setIsSyncing(true);
        const synced = await waitUntilBlock(client.chain.id, blockNumber);

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
      mergeTraitImages,
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

  const isLoading = isCreating || isMerging;
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
        <VStack pl={6} pr={20} spacing={8} w="100%">
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
              Write a description for your character (200 character limit)
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
        <VStack pl={6} pr={8} spacing={8} w="100%">
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
                <Flex align="center" gap={10} mt={4}>
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
            <Flex gap={12} w="100%">
              <CompositeCharacterImage traits={traits} />
              <VStack w="100%">
                {traits.map((trait: string, i: number) => (
                  <TraitVariantControls
                    index={i}
                    key={`trait-controls-${trait}`}
                    traits={traits}
                    setTraits={setTraits}
                    traitsByType={TRAITS[i]}
                  />
                ))}
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
            <HStack left={4} pos="absolute" top={4}>
              <XPDisplay experience={'0'} />
            </HStack>
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
        <Flex justify="space-between" w="100%">
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
          <Flex gap={4}>
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
        <Flex justify="space-between" w="100%">
          <Flex gap={4}>
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

const CompositeCharacterImage: React.FC<{ traits: Traits }> = ({ traits }) => {
  return (
    <AspectRatio ratio={10 / 13} w="full">
      <Box bg="accent" borderRadius="10px" pos="relative">
        {traits.map((trait: string) => {
          return (
            <Image
              alt={`${trait.split('_')[1]} trait layer`}
              h="100%"
              key={`composit-trait-image-${trait}`}
              left={0}
              objectFit="cover"
              pos="absolute"
              src={getImageUrl(trait)}
              top={0}
              w="100%"
            />
          );
        })}
      </Box>
    </AspectRatio>
  );
};
