import {
  AspectRatio,
  Box,
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Image,
  Input,
  Switch,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { parseAbi } from 'viem';
import { Address, usePublicClient, useWalletClient } from 'wagmi';

import { TransactionPending } from '@/components/TransactionPending';
import { useGame } from '@/contexts/GameContext';
import { waitUntilBlock } from '@/hooks/useGraphHealth';
import { useToast } from '@/hooks/useToast';
import { useUploadFile } from '@/hooks/useUploadFile';

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
};

export const JoinGame: React.FC<JoinGameProps> = ({ onClose }) => {
  const { game, character, reload: reloadGame } = useGame();
  const { data: walletClient } = useWalletClient();
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
      const [blob0, blob1, blob2, blob3, blob4, blob5] = await Promise.all([
        fetch(getImageUrl(traits[0])).then(r => r.blob()),
        fetch(getImageUrl(traits[1])).then(r => r.blob()),
        fetch(getImageUrl(traits[2])).then(r => r.blob()),
        fetch(getImageUrl(traits[3])).then(r => r.blob()),
        fetch(getImageUrl(traits[4])).then(r => r.blob()),
        fetch(getImageUrl(traits[5])).then(r => r.blob()),
      ]);

      const formData = new FormData();
      formData.append('layer0', blob0);
      formData.append('layer1', blob1);
      formData.append('layer2', blob2);
      formData.append('layer3', blob3);
      formData.append('layer4', blob4);
      formData.append('layer5', blob5);

      const response = await fetch(`/api/uploadTraits`, {
        method: 'POST',
        body: formData,
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

      if (!walletClient) throw new Error('Could not find a wallet client');
      if (!game) throw new Error('Missing game data');
      if (character) throw new Error('Character already exists');

      let cid = '';

      if (showUpload) {
        cid = await onUpload();
      } else {
        cid = await mergeTraitImages();
      }

      if (!cid)
        throw new Error('Something went wrong uploading your character avatar');

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

      try {
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

        const transactionhash = await walletClient.writeContract({
          chain: walletClient.chain,
          account: walletClient.account?.address as Address,
          address: game.id as Address,
          abi: parseAbi([
            'function rollCharacterSheet(string calldata _tokenUri) external',
          ]),
          functionName: 'rollCharacterSheet',
          args: [characterMetadataCid],
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
        const synced = await waitUntilBlock(blockNumber);

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

  const onNext = useCallback(() => {
    if (hasError) {
      setShowError(true);
      return;
    }
    setShowError(false);
    setStep(1);
  }, [hasError]);

  const onBack = useCallback(() => {
    setStep(0);
    setShowError(false);
    setShowUpload(false);
  }, []);

  const isLoading = isCreating || isMerging;
  const isDisabled = isLoading || isUploading;

  if (txFailed) {
    return (
      <VStack py={10} spacing={4}>
        <Text>Transaction failed.</Text>
        <Button onClick={onClose} variant="outline">
          Close
        </Button>
      </VStack>
    );
  }

  if (isSynced) {
    return (
      <VStack py={10} spacing={4}>
        <Text>Your character was successfully created!</Text>
        <Button onClick={onClose} variant="outline">
          Close
        </Button>
      </VStack>
    );
  }

  if (txHash) {
    return (
      <TransactionPending
        isSyncing={isSyncing}
        text="Your character is being created."
        txHash={txHash}
      />
    );
  }

  return (
    <VStack as="form" onSubmit={onJoinCharacter} spacing={8} w="100%">
      <Flex justify="space-between" w="100%">
        <Text fontSize="sm" textTransform="uppercase">
          Character creation - step {step + 1} / 2
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
            <Flex align="center" gap={4} mt={4}>
              <Text
                color={showUpload ? 'white' : 'accent'}
                fontSize="sm"
                fontWeight="500"
              >
                No
              </Text>
              <Switch
                isChecked={showUpload}
                onChange={() => setShowUpload(!showUpload)}
              />
              <Text
                color={showUpload ? 'accent' : 'white'}
                fontSize="sm"
                fontWeight="500"
              >
                Yes
              </Text>
            </Flex>
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
              <AspectRatio ratio={10 / 13} w="100%">
                <Box bg="accent" borderRadius="10px" pos="relative">
                  {traits.map((trait: string) => {
                    return (
                      <Image
                        alt={`${trait.split('_')[1]} trait layer`}
                        h="100%"
                        key={`image-${trait}`}
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

      {step === 0 && (
        <Flex justify="flex-end" w="100%">
          <Button
            isDisabled={isDisabled}
            isLoading={isLoading}
            mr={8}
            onClick={onNext}
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
            onClick={onBack}
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
              onClick={() => undefined}
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
    </VStack>
  );
};
