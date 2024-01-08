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
import { parseAbi } from 'viem';
import { Address, useNetwork, usePublicClient, useWalletClient } from 'wagmi';

import { CompositeCharacterImage } from '@/components/CompositeCharacterImage';
import { Switch } from '@/components/Switch';
import { TraitVariantControls } from '@/components/TraitVariantControls';
import { TransactionPending } from '@/components/TransactionPending';
import { XPDisplay, XPDisplaySmall } from '@/components/XPDisplay';
import { useCharacterActions } from '@/contexts/CharacterActionsContext';
import { useGame } from '@/contexts/GameContext';
import { waitUntilBlock } from '@/graphql/health';
import { useCharacterLimitMessage } from '@/hooks/useCharacterLimitMessage';
import { useToast } from '@/hooks/useToast';
import { useUploadFile } from '@/hooks/useUploadFile';
import {
  BaseTraitType,
  CharacterTraits,
  DEFAULT_TRAITS,
  EquippableTraitType,
  formatTraitsForUpload,
  getEquippableTraitName,
  getTraitsObjectFromAttributes,
  traitPositionToIndex,
  TRAITS,
  TraitsArray,
} from '@/lib/traits';
import { getChainLabelFromId } from '@/lib/web3';
import { shortenText } from '@/utils/helpers';
import { Attribute } from '@/utils/types';

type EditCharacterProps = {
  topOfCardRef: React.RefObject<HTMLDivElement>;
};

export const EditCharacter: React.FC<EditCharacterProps> = ({
  topOfCardRef,
}) => {
  const { game, character, reload: reloadGame } = useGame();
  const { setShowEditCharacter, uriNeedsUpgraded } = useCharacterActions();
  const { data: walletClient } = useWalletClient();
  const { chain } = useNetwork();
  const publicClient = usePublicClient();
  const { renderError } = useToast();
  const useSmallXp = useBreakpointValue({ base: true, md: false });

  const {
    file: newAvatarFile,
    setFile: setNewAvatar,
    onRemove,
    onUpload,
    isUploading,
    isUploaded,
  } = useUploadFile({ fileName: 'characterAvatar' });
  const [step, setStep] = useState<number>(0);

  const [newName, setNewName] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const characterLimitMessage = useCharacterLimitMessage({
    characterLimit: 200,
    currentCharacterCount: newDescription.length,
  });
  const [newAvatarImage, setNewAvatarImage] = useState<string | null>(null);

  const [showUpload, setShowUpload] = useState<boolean>(false);
  const [originalTraits, setOriginalTraits] =
    useState<TraitsArray>(DEFAULT_TRAITS);
  const [traits, setTraits] = useState<TraitsArray>(DEFAULT_TRAITS);
  const [previewTraits, setPreviewTraits] =
    useState<TraitsArray>(DEFAULT_TRAITS);

  const [showError, setShowError] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txFailed, setTxFailed] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSynced, setIsSynced] = useState<boolean>(false);

  const sameName = useMemo(
    () => newName === character?.name && !!newName,
    [newName, character?.name],
  );

  const invalidDescription = useMemo(() => {
    return !!newDescription && newDescription.length > 200;
  }, [newDescription]);

  const sameDescription = useMemo(() => {
    return !!newDescription && character?.description === newDescription;
  }, [newDescription, character?.description]);

  const sameAvatar = useMemo(() => {
    if (!character?.attributes || character?.attributes.length === 0) {
      return showUpload && !newAvatarFile;
    }
    return !!newAvatarImage && newAvatarImage === character?.image;
  }, [
    character?.attributes,
    character?.image,
    newAvatarFile,
    newAvatarImage,
    showUpload,
  ]);

  const sameTraits = useMemo(() => {
    if (showUpload) return false;
    return traits.every((t, i) => t === originalTraits[i]);
  }, [originalTraits, showUpload, traits]);

  const hasError = useMemo(
    () =>
      !newName ||
      !newDescription ||
      invalidDescription ||
      !newAvatarImage ||
      (!uriNeedsUpgraded &&
        sameName &&
        sameDescription &&
        sameAvatar &&
        sameTraits),
    [
      newName,
      newDescription,
      newAvatarImage,
      invalidDescription,
      sameName,
      sameDescription,
      sameAvatar,
      sameTraits,
      uriNeedsUpgraded,
    ],
  );

  // Removes error message when user starts typing or changes avatar
  useEffect(() => {
    setShowError(false);
  }, [newName, newDescription, newAvatarImage]);

  const resetData = useCallback(() => {
    setNewName(character?.name ?? '');
    setNewDescription(character?.description ?? '');
    setNewAvatarImage(character?.image ?? null);
    if (character?.attributes && character?.attributes.length > 0) {
      const traitsObject = getTraitsObjectFromAttributes(character.attributes);
      const traitsArray = [...DEFAULT_TRAITS] as TraitsArray;
      Object.keys(traitsObject).forEach(traitType => {
        const traitName = traitsObject[traitType as keyof CharacterTraits];
        const index = traitPositionToIndex(traitType as keyof CharacterTraits);

        if (
          traitType === EquippableTraitType.EQUIPPED_ITEM_1 ||
          traitType === EquippableTraitType.EQUIPPED_ITEM_2
        ) {
          traitsArray[index] = '';
          return;
        }

        if (traitType === EquippableTraitType.EQUIPPED_WEARABLE) {
          const traitVariant =
            traitsObject[BaseTraitType.CLOTHING]?.split('_')[1];
          const originalTrait = TRAITS[index][traitVariant.toLowerCase()]?.find(
            t => t.includes(traitsObject[BaseTraitType.CLOTHING]),
          );
          if (!originalTrait) return;
          // Getting the original trait is required in order to get original color hex
          traitsArray[5] = originalTrait;
          return;
        }

        if (!traitName) return;
        const traitVariant = traitName?.split('_')[1];
        const originalTrait = TRAITS[index][traitVariant.toLowerCase()]?.find(
          t => t.includes(traitName),
        );
        if (!originalTrait) return;
        // Getting the original trait is required in order to get original color hex
        traitsArray[index] = originalTrait;
      });
      setOriginalTraits(traitsArray);
      setTraits(traitsArray);
      setPreviewTraits(traitsArray);
      setShowUpload(false);
    } else {
      setTraits(DEFAULT_TRAITS);
      setShowUpload(true);
    }
    setShowError(false);
    onRemove();

    setIsUpdating(false);
    setTxHash(null);
    setTxFailed(false);
    setIsSyncing(false);
    setIsSynced(false);
  }, [character, onRemove]);

  useEffect(() => {
    if (newAvatarFile) {
      setNewAvatarImage(URL.createObjectURL(newAvatarFile));
    }
  }, [newAvatarFile]);

  const onRemoveImage = useCallback(() => {
    setNewAvatarImage(null);
    onRemove();
  }, [onRemove]);

  useEffect(() => {
    resetData();
    topOfCardRef?.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [resetData, topOfCardRef]);

  const onSetStep = useCallback(
    (newStep: number) => {
      setStep(newStep);
      topOfCardRef?.current?.scrollIntoView({
        behavior: 'smooth',
      });
    },
    [topOfCardRef],
  );

  const onEditCharacter = useCallback(
    async (e: React.FormEvent<HTMLDivElement>) => {
      e.preventDefault();

      if (hasError) {
        setShowError(true);
        onSetStep(0);
        return;
      }

      setIsUpdating(true);

      try {
        if (!walletClient) throw new Error('Could not find a wallet client');
        if (!chain) throw new Error('Could not find a connected chain');
        if (!game) throw new Error('Missing game data');
        if (!character) throw new Error('Character not found');

        let attributes: Attribute[] | null = null;
        let cid =
          character?.image
            .split('/')
            .filter(s => !!s)
            .pop() ?? '';

        if (showUpload && newAvatarFile) {
          cid = await onUpload();
        } else if (!sameTraits && !showUpload) {
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
          };

          const traitsArray = await formatTraitsForUpload(
            traitsObject,
            game.chainId,
            character.id,
          );

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
          attributes: {
            trait_type: string;
            value: string;
          }[];
        } = {
          name: newName,
          description: newDescription,
          image: `ipfs://${cid}`,
          attributes: [],
        };

        if (!newAvatarFile && character.attributes) {
          characterMetadata['attributes'] = character.attributes;
        }

        if (attributes) {
          characterMetadata['attributes'] = attributes;
        }

        const chainLabel = getChainLabelFromId(chain.id);
        const apiRoute = `/api/characters/${chainLabel}/${character.id}/update`;
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

        if (uriNeedsUpgraded) {
          const transactionhash = await walletClient.writeContract({
            chain: walletClient.chain,
            account: walletClient.account?.address as Address,
            address: game.id as Address,
            abi: parseAbi([
              'function updateCharacterMetadata(string calldata newCid) public',
            ]),
            functionName: 'updateCharacterMetadata',
            args: [character.id],
          });
          setTxHash(transactionhash);

          const client = publicClient ?? walletClient;
          const { blockNumber, status } =
            await client.waitForTransactionReceipt({
              hash: transactionhash,
            });

          if (status === 'reverted') {
            setTxFailed(true);
            setIsUpdating(false);
            throw new Error('Transaction failed');
          }

          setIsSyncing(true);
          const synced = await waitUntilBlock(client.chain.id, blockNumber);
          if (!synced) throw new Error('Something went wrong while syncing');
        }

        setIsSynced(true);
        reloadGame();
        setShowEditCharacter(false);
      } catch (e) {
        renderError(
          e,
          `Something went wrong updating ${character?.name}'s metadata`,
        );
      } finally {
        setIsSyncing(false);
        setIsUpdating(false);
      }
    },
    [
      chain,
      character,
      game,
      hasError,
      newName,
      newAvatarFile,
      newDescription,
      onSetStep,
      onUpload,
      publicClient,
      reloadGame,
      renderError,
      sameTraits,
      setShowEditCharacter,
      showUpload,
      traits,
      uriNeedsUpgraded,
      walletClient,
    ],
  );

  const onPreview = useCallback(() => {
    if (!character) return;
    if (hasError) {
      setShowError(true);
      onSetStep(0);
      return;
    }
    let traitsObject: CharacterTraits = {
      [BaseTraitType.BACKGROUND]: traits[0],
      [BaseTraitType.BODY]: traits[1],
      [BaseTraitType.EYES]: traits[2],
      [BaseTraitType.HAIR]: traits[3],
      [EquippableTraitType.EQUIPPED_ITEM_1]: '',
      [BaseTraitType.CLOTHING]: traits[5],
      [EquippableTraitType.EQUIPPED_WEARABLE]: '',
      [BaseTraitType.MOUTH]: traits[6],
      [EquippableTraitType.EQUIPPED_ITEM_2]: '',
    };

    const equippedItem1s = character.equippedItems
      .filter(
        i =>
          i.attributes &&
          i.attributes[0]?.value === EquippableTraitType.EQUIPPED_ITEM_1,
      )
      .sort((a, b) => {
        if (!a.equippedAt || !b.equippedAt) return 0;
        return b.equippedAt - a.equippedAt;
      });

    const equippedWearables = character.equippedItems
      .filter(
        i =>
          i.attributes &&
          i.attributes[0]?.value === EquippableTraitType.EQUIPPED_WEARABLE,
      )
      .sort((a, b) => {
        if (!a.equippedAt || !b.equippedAt) return 0;
        return b.equippedAt - a.equippedAt;
      });

    const equippedItem2s = character.equippedItems
      .filter(
        i =>
          i.attributes &&
          i.attributes[0]?.value === EquippableTraitType.EQUIPPED_ITEM_2,
      )
      .sort((a, b) => {
        if (!a.equippedAt || !b.equippedAt) return 0;
        return b.equippedAt - a.equippedAt;
      });

    traitsObject = getEquippableTraitName(
      EquippableTraitType.EQUIPPED_ITEM_1,
      equippedItem1s,
      traitsObject,
    );

    traitsObject = getEquippableTraitName(
      EquippableTraitType.EQUIPPED_WEARABLE,
      equippedWearables,
      traitsObject,
    );

    traitsObject = getEquippableTraitName(
      EquippableTraitType.EQUIPPED_ITEM_2,
      equippedItem2s,
      traitsObject,
    );

    const traitsArray: TraitsArray = ['', '', '', '', '', '', '', ''];
    Object.keys(traitsObject).forEach(traitType => {
      const trait = traitsObject[traitType as keyof CharacterTraits];
      const index = traitPositionToIndex(traitType as keyof CharacterTraits);

      if (
        traitType === BaseTraitType.CLOTHING &&
        !!traitsObject[EquippableTraitType.EQUIPPED_WEARABLE]
      ) {
        return;
      }

      if (!trait) return;
      traitsArray[index] = trait;
    });
    setPreviewTraits(traitsArray);
    onSetStep(2);
  }, [character, hasError, traits, onSetStep]);

  const isLoading = isUpdating;
  const isDisabled = isLoading || isUploading;

  const noChanges = useMemo(() => {
    return sameName && sameDescription && sameAvatar;
  }, [sameName, sameDescription, sameAvatar]);

  if (txFailed) {
    return (
      <VStack py={10} spacing={4} w="100%">
        <Text>Transaction failed.</Text>
        <Button onClick={() => setShowEditCharacter(false)} variant="ghost">
          continue
        </Button>
      </VStack>
    );
  }

  if (isSynced) {
    return (
      <VStack py={10} spacing={4} w="100%">
        <Text>Your character was successfully updated!</Text>
        <Button onClick={() => setShowEditCharacter(false)} variant="ghost">
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
          text="Your character is being updated."
          txHash={txHash}
          chainId={game?.chainId}
        />
      </VStack>
    );
  }

  return (
    <>
      <VStack as="form" onSubmit={onEditCharacter} spacing={8} w="100%">
        <Flex justify="space-between" w="100%">
          <Text fontSize="sm" textTransform="uppercase">
            Character editing - {step === 2 ? 'preview' : `${step + 1} / 2`}
          </Text>
          <Button
            onClick={() => setShowEditCharacter(false)}
            size="sm"
            variant="ghost"
          >
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
            {uriNeedsUpgraded && (
              <Text color="red">
                Your metadata URI is out of date. Please click &quot;Next
                step&quot; then &quot;Update&quot; below to upgrade to the
                latest version.
              </Text>
            )}
            <FormControl isInvalid={showError && (!newName || noChanges)}>
              <FormLabel>Character Name</FormLabel>
              <Input
                onChange={e => setNewName(e.target.value)}
                value={newName}
              />
              {showError && !newName && (
                <FormHelperText color="red">
                  A character name is required
                </FormHelperText>
              )}
              {showError && noChanges && (
                <FormHelperText color="red">
                  New name, description, or avatar must be different from the
                  old
                </FormHelperText>
              )}
            </FormControl>

            <FormControl
              isInvalid={
                showError &&
                (!newDescription || invalidDescription || noChanges)
              }
            >
              <FormLabel>
                Character Description ({characterLimitMessage})
              </FormLabel>
              <Textarea
                onChange={e => setNewDescription(e.target.value)}
                value={newDescription}
              />
              {showError && !newDescription && (
                <FormHelperText color="red">
                  A character description is required
                </FormHelperText>
              )}
              {showError && invalidDescription && (
                <FormHelperText color="red">
                  Character description must be less than 200 characters
                </FormHelperText>
              )}
              {showError && noChanges && (
                <FormHelperText color="red">
                  New name, description, or avatar must be different from the
                  old
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
              <FormControl
                isInvalid={showError && (!newAvatarImage || noChanges)}
              >
                <FormLabel>Character Avatar</FormLabel>
                {!newAvatarImage && (
                  <Input
                    accept=".png, .jpg, .jpeg, .svg"
                    disabled={isUploading}
                    onChange={e => setNewAvatar(e.target.files?.[0] ?? null)}
                    type="file"
                    variant="file"
                  />
                )}
                {newAvatarImage && (
                  <Flex
                    align="center"
                    flexDir={{ base: 'column', sm: 'row' }}
                    gap={10}
                    mt={4}
                  >
                    <Image
                      alt="character avatar"
                      objectFit="contain"
                      src={newAvatarImage}
                      w="300px"
                    />
                    <Button
                      isDisabled={isUploading || isUploaded}
                      isLoading={isUploading}
                      loadingText="Uploading..."
                      mt={4}
                      onClick={!isUploaded ? onRemoveImage : undefined}
                      type="button"
                      variant="outline"
                    >
                      {isUploaded ? 'Uploaded' : 'Remove'}
                    </Button>
                  </Flex>
                )}
                {showError && !newAvatarImage && (
                  <FormHelperText color="red">
                    A character avatar is required
                  </FormHelperText>
                )}
                {showError && noChanges && (
                  <FormHelperText color="red">
                    New name, description, or avatar must be different from the
                    old
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
              {showUpload && newAvatarImage ? (
                <Image
                  alt="character avatar"
                  objectFit="contain"
                  src={newAvatarImage}
                  w="300px"
                />
              ) : (
                <CompositeCharacterImage traits={previewTraits} />
              )}
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
                {newName}
              </Heading>
              <Text fontSize="sm" fontWeight={300} lineHeight={5}>
                {shortenText(newDescription, 100)}
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
          <Flex justify="space-between" w="100%">
            <Button
              isDisabled={isDisabled}
              onClick={() => resetData()}
              size="sm"
              type="button"
              variant="outline"
            >
              Reset
            </Button>
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
            <Flex
              flexDir={{ base: 'column', md: 'row' }}
              gap={{ base: 2, md: 4 }}
            >
              <Button
                isDisabled={isDisabled}
                onClick={() => resetData()}
                size="sm"
                type="button"
                variant="outline"
              >
                Reset
              </Button>
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
            </Flex>
            <Flex flexDir={{ base: 'column', md: 'row' }} gap={4}>
              <Button
                isDisabled={isDisabled}
                isLoading={isLoading}
                onClick={onPreview}
                size="sm"
                type="button"
                variant="outline"
              >
                Preview
              </Button>
              <Button
                isDisabled={isDisabled}
                isLoading={isLoading}
                loadingText="Updating..."
                size="sm"
                type="submit"
                variant="solid"
              >
                Update
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
                onClick={() => resetData()}
                size="sm"
                type="button"
                variant="outline"
              >
                Reset
              </Button>
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
              loadingText="Updating..."
              size="sm"
              type="submit"
              variant="solid"
            >
              Update
            </Button>
          </Flex>
        )}
      </VStack>
    </>
  );
};
