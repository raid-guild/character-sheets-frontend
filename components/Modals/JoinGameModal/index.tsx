import {
  Box,
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Switch,
  Text,
  Textarea,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { parseAbi } from 'viem';
import { Address, usePublicClient, useWalletClient } from 'wagmi';

import { TransactionPending } from '@/components/TransactionPending';
import { useGame } from '@/contexts/GameContext';
import { waitUntilBlock } from '@/hooks/useGraphHealth';
import { useUploadFile } from '@/hooks/useUploadFile';

import {
  BODY_TRAITS,
  CLOTHING_TRAITS,
  EYES_TRAITS,
  formatFileName,
  getImageUrl,
  HAIR_TRAITS,
  MOUTH_TRAITS,
  TRAITS,
  TraitType,
} from './traits';

type JoinGameModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const JoinGameModal: React.FC<JoinGameModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { game, character, reload: reloadGame } = useGame();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const toast = useToast();

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
  const [activeTab, setActiveTab] = useState<TraitType>(TraitType.BODY);
  const [traits, setTraits] = useState<string[]>([
    '1_Basic_a',
    '2_Basic_a',
    '3_Bald_a',
    '4_Villager1_a',
    '5_Basic_a',
  ]);
  const [isMerging, setIsMerging] = useState<boolean>(false);

  const [showError, setShowError] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
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
    setActiveTab(TraitType.BODY);
    setTraits([
      '1_Basic_a',
      '2_Basic_a',
      '3_Bald_a',
      '4_Villager1_a',
      '5_Basic_a',
    ]);

    setCharacterName('');
    setCharacterDescription('');
    setCharacterAvatar(null);
    setShowError(false);

    setIsCreating(false);
    setTxHash(null);
    setIsSyncing(false);
    setIsSynced(false);
  }, [setCharacterAvatar]);

  useEffect(() => {
    if (!isOpen) {
      resetData();
    }
  }, [resetData, isOpen]);

  const mergeTraitImages = useCallback(async (): Promise<string> => {
    try {
      setIsMerging(true);
      const [blob1, blob2, blob3, blob4, blob5] = await Promise.all([
        fetch(getImageUrl(TRAITS[traits[0]])).then(r => r.blob()),
        fetch(getImageUrl(TRAITS[traits[1]])).then(r => r.blob()),
        fetch(getImageUrl(TRAITS[traits[2]])).then(r => r.blob()),
        fetch(getImageUrl(TRAITS[traits[3]])).then(r => r.blob()),
        fetch(getImageUrl(TRAITS[traits[4]])).then(r => r.blob()),
      ]);

      const formData = new FormData();
      formData.append('layer1', blob1);
      formData.append('layer2', blob2);
      formData.append('layer3', blob3);
      formData.append('layer4', blob4);
      formData.append('layer5', blob5);

      const response = await fetch(`/api/uploadTraits`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        toast({
          description: 'Something went wrong uploading your character avatar.',
          position: 'top',
          status: 'error',
        });
        return '';
      }

      const { cid } = await response.json();
      return cid;
    } catch (e) {
      console.error(e);
      toast({
        description: 'Something went wrong uploading your character avatar.',
        position: 'top',
        status: 'error',
      });
      return '';
    } finally {
      setIsMerging(false);
    }
  }, [toast, traits]);

  const onJoinCharacter = useCallback(
    async (e: React.FormEvent<HTMLDivElement>) => {
      e.preventDefault();

      if (hasError) {
        setShowError(true);
        return;
      }

      if (!walletClient) {
        toast({
          description: 'Wallet client is not connected.',
          position: 'top',
          status: 'error',
        });
        console.error('Could not find a wallet client.');
        return;
      }

      if (!game) {
        toast({
          description: `Could not find the game.`,
          position: 'top',
          status: 'error',
        });
        console.error(`Missing game data.`);
        return;
      }

      if (character) {
        toast({
          description: `Chracter already exists.`,
          position: 'top',
          status: 'error',
        });
        console.error(`Character already exists.`);
        return;
      }

      let cid = '';

      if (showUpload) {
        cid = await onUpload();
      } else {
        cid = await mergeTraitImages();
      }

      if (!cid) {
        toast({
          description: 'Something went wrong uploading your character avatar.',
          position: 'top',
          status: 'error',
        });
        return;
      }

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
        // TODO: For now, we are removing the clothing trait from metadata
        characterMetadata['attributes'] = attributes.filter(
          a => a.trait_type !== TraitType.CLOTHING,
        );
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

        if (!res.ok) {
          toast({
            description:
              'Something went wrong uploading your character metadata.',
            position: 'top',
            status: 'error',
          });
          return;
        }

        const { cid: characterMetadataCid } = await res.json();

        if (!characterMetadataCid) {
          toast({
            description:
              'Something went wrong uploading your character metadata.',
            position: 'top',
            status: 'error',
          });
          return;
        }


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
        const receipt = await client.waitForTransactionReceipt({
          hash: transactionhash,
        });

        setIsSyncing(true);
        const synced = await waitUntilBlock(receipt.blockNumber);

        if (!synced) {
          toast({
            description: 'Something went wrong while syncing.',
            position: 'top',
            status: 'warning',
          });
          return;
        }
        setIsSynced(true);
        reloadGame();
      } catch (e) {
        toast({
          description: 'Something went wrong creating your character.',
          position: 'top',
          status: 'error',
        });
        console.error(e);
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
      toast,
      traits,
      reloadGame,
      walletClient,
    ],
  );

  const onNext = useCallback(() => {
    if (hasError) {
      setShowError(true);
      return;
    }
    setShowError(false);

    if (step === 1) {
      switch (activeTab) {
        case TraitType.BODY:
          setActiveTab(TraitType.EYES);
          break;
        case TraitType.EYES:
          setActiveTab(TraitType.HAIR);
          break;
        case TraitType.HAIR:
          setActiveTab(TraitType.CLOTHING);
          break;
        case TraitType.CLOTHING:
          setActiveTab(TraitType.MOUTH);
          break;
        default:
          setActiveTab(TraitType.BODY);
          break;
      }
    } else {
      setStep(1);
    }
  }, [activeTab, hasError, step]);

  const onBack = useCallback(() => {
    setStep(0);
    setShowError(false);
    setShowUpload(false);
  }, []);

  const isLoading = isCreating || isMerging;
  const isDisabled = isLoading || isUploading;
  const showCreateButton =
    step === 1 && (activeTab === TraitType.MOUTH || showUpload);

  const content = () => {
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
      <VStack as="form" onSubmit={onJoinCharacter} spacing={8}>
        {step === 0 && (
          <>
            <FormControl isInvalid={showError && !characterName}>
              <FormLabel>Character Name</FormLabel>
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
              <FormLabel>Character Description (200 character limit)</FormLabel>
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
          </>
        )}

        {step === 1 && (
          <>
            {step === 1 && (
              <VStack>
                <Flex align="center" gap={4}>
                  <Text>Want to upload your own image avatar?</Text>
                  <Switch
                    isChecked={showUpload}
                    onChange={() => setShowUpload(!showUpload)}
                  />
                </Flex>
                <Text fontSize="12px">
                  Uploading your own avatar prevents visual rendering of
                  equipped items in the future.
                </Text>
              </VStack>
            )}
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
              <>
                <SimpleGrid columns={5} spacing={0.5} w="100%">
                  <Button
                    border="3px solid black"
                    onClick={() => setActiveTab(TraitType.BODY)}
                    p={4}
                    size="sm"
                    variant={activeTab === TraitType.BODY ? 'solid' : 'outline'}
                    w="100%"
                  >
                    <Text>Body</Text>
                  </Button>
                  <Button
                    border="3px solid black"
                    onClick={() => setActiveTab(TraitType.EYES)}
                    p={4}
                    size="sm"
                    variant={activeTab === TraitType.EYES ? 'solid' : 'outline'}
                    w="100%"
                  >
                    <Text>Eyes</Text>
                  </Button>
                  <Button
                    border="3px solid black"
                    onClick={() => setActiveTab(TraitType.HAIR)}
                    p={4}
                    size="sm"
                    variant={activeTab === TraitType.HAIR ? 'solid' : 'outline'}
                    w="100%"
                  >
                    <Text>Hair</Text>
                  </Button>
                  <Button
                    border="3px solid black"
                    onClick={() => setActiveTab(TraitType.CLOTHING)}
                    p={4}
                    size="sm"
                    variant={
                      activeTab === TraitType.CLOTHING ? 'solid' : 'outline'
                    }
                    w="100%"
                  >
                    <Text>Clothing</Text>
                  </Button>
                  <Button
                    border="3px solid black"
                    onClick={() => setActiveTab(TraitType.MOUTH)}
                    p={4}
                    size="sm"
                    variant={
                      activeTab === TraitType.MOUTH ? 'solid' : 'outline'
                    }
                    w="100%"
                  >
                    <Text>Mouth</Text>
                  </Button>
                </SimpleGrid>

                <TraitVariantControls
                  activeTab={activeTab}
                  setTraits={setTraits}
                  traits={traits}
                />

                <Box
                  bg="lightgrey"
                  border="3px solid black"
                  pos="relative"
                  h="400px"
                  w="300px"
                >
                  {traits.map((trait: string) => {
                    return (
                      <Image
                        alt={`${activeTab} trait layer`}
                        h="100%"
                        key={`image-${trait}`}
                        left={0}
                        objectFit="cover"
                        pos="absolute"
                        src={getImageUrl(TRAITS[trait])}
                        top={0}
                        w="100%"
                      />
                    );
                  })}
                </Box>
              </>
            )}
          </>
        )}

        {!showCreateButton && (
          <Flex gap={4}>
            {step > 0 && (
              <Button
                isDisabled={isDisabled}
                isLoading={isLoading}
                loadingText="Back"
                onClick={onBack}
                size="sm"
                type="button"
                variant="outline"
              >
                Back
              </Button>
            )}
            <Button
              isDisabled={isDisabled}
              isLoading={isLoading}
              loadingText="Next"
              onClick={onNext}
              size="sm"
              type="button"
            >
              Next
            </Button>
          </Flex>
        )}

        {showCreateButton && (
          <Flex alignItems="center" direction="column" gap={4}>
            <Button
              isDisabled={isDisabled}
              isLoading={isLoading}
              loadingText="Creating..."
              type="submit"
            >
              Create
            </Button>
            <Button
              isDisabled={isDisabled}
              isLoading={isLoading}
              loadingText="Back"
              onClick={onBack}
              size="sm"
              type="button"
              variant="outline"
            >
              Back
            </Button>
          </Flex>
        )}
      </VStack>
    );
  };

  return (
    <Modal
      closeOnEsc={!isLoading}
      closeOnOverlayClick={!isLoading}
      isOpen={isOpen}
      onClose={onClose}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Text>Create your Character</Text>
          <ModalCloseButton size="lg" />
        </ModalHeader>
        <ModalBody>{content()}</ModalBody>
      </ModalContent>
    </Modal>
  );
};

type TraitVariantControlsProps = {
  activeTab: TraitType;
  setTraits: (traits: string[]) => void;
  traits: string[];
};

const TraitVariantControls: React.FC<TraitVariantControlsProps> = ({
  activeTab,
  setTraits,
  traits,
}) => {
  const selectedTrait = useMemo(() => {
    switch (activeTab) {
      case TraitType.BODY:
        return traits[0];
      case TraitType.EYES:
        return traits[1];
      case TraitType.HAIR:
        return traits[2];
      case TraitType.CLOTHING:
        return traits[3];
      case TraitType.MOUTH:
        return traits[4];
      default:
        return traits[0];
    }
  }, [activeTab, traits]);

  const activeTraits = useMemo(() => {
    switch (activeTab) {
      case TraitType.BODY:
        return BODY_TRAITS;
      case TraitType.EYES:
        return EYES_TRAITS;
      case TraitType.HAIR:
        return HAIR_TRAITS;
      case TraitType.CLOTHING:
        return CLOTHING_TRAITS;
      case TraitType.MOUTH:
        return MOUTH_TRAITS;
      default:
        return [];
    }
  }, [activeTab]);

  const [, variant, color] = selectedTrait.split('_');

  const onPreviousVariant = useCallback(() => {
    const nameIndex = traits.findIndex(t => t === selectedTrait);
    const fullTraitIndex = activeTraits.findIndex(
      t => formatFileName(t) === selectedTrait,
    );
    const previous = activeTraits[fullTraitIndex - 1];

    if (!previous) {
      return;
    }

    const newTraits = [...traits];
    newTraits[nameIndex] = formatFileName(previous);
    setTraits(newTraits);
  }, [activeTraits, selectedTrait, setTraits, traits]);

  const onNextVariant = useCallback(() => {
    const nameIndex = traits.findIndex(t => t === selectedTrait);
    const fullTraitIndex = activeTraits.findIndex(
      t => formatFileName(t) === selectedTrait,
    );
    const next = activeTraits[fullTraitIndex + 1];

    if (!next) {
      return;
    }

    const newTraits = [...traits];
    newTraits[nameIndex] = formatFileName(next);
    setTraits(newTraits);
  }, [activeTraits, selectedTrait, setTraits, traits]);

  const disablePrevious = useMemo(() => {
    const fullTraitIndex = activeTraits.findIndex(
      t => formatFileName(t) === selectedTrait,
    );
    return fullTraitIndex === 0;
  }, [activeTraits, selectedTrait]);

  const disableNext = useMemo(() => {
    const fullTraitIndex = activeTraits.findIndex(
      t => formatFileName(t) === selectedTrait,
    );
    return fullTraitIndex === activeTraits.length - 1;
  }, [activeTraits, selectedTrait]);

  return (
    <Flex justify="space-between" w="250px">
      <Button
        isDisabled={disablePrevious}
        onClick={onPreviousVariant}
        size="xs"
      >
        &#8592;
      </Button>
      <Text>
        {variant} {color.toUpperCase()}
      </Text>
      <Button isDisabled={disableNext} onClick={onNextVariant} size="xs">
        &#8594;
      </Button>
    </Flex>
  );
};
