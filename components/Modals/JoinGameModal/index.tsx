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
  Text,
  Textarea,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { encodeAbiParameters, parseAbi } from 'viem';
import { Address, usePublicClient, useWalletClient } from 'wagmi';

import { TransactionPending } from '@/components/TransactionPending';
import { useGame } from '@/contexts/GameContext';
import { waitUntilBlock } from '@/hooks/useGraphHealth';
import { useUploadFile } from '@/hooks/useUploadFile';

import {
  BODY_TRAITS,
  EYES_TRAITS,
  formatFileName,
  getImageUrl,
  HAIR_TRAITS,
  MOUTH_TRAITS,
  TRAITS,
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
    // onRemove,
    onUpload,
    isUploading,
    // isUploaded,
  } = useUploadFile({ fileName: 'characterAvatar' });
  const [characterName, setCharacterName] = useState<string>('');
  const [characterDescription, setCharacterDescription] = useState<string>('');

  const [activeTab, setActiveTab] = useState<
    'body' | 'eyes' | 'hair' | 'mouth'
  >('body');
  const [traits, setTraits] = useState<string[]>([
    '1_Basic_a',
    '2_Basic_a',
    '3_Bald_a',
    '5_Basic_a',
  ]);

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
      !characterAvatar ||
      !characterName ||
      invalidCharacterDescription
    );
  }, [
    characterDescription,
    characterAvatar,
    characterName,
    invalidCharacterDescription,
  ]);

  const resetData = useCallback(() => {
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

      const cid = await onUpload();

      if (!cid) {
        toast({
          description: 'Something went wrong uploading your character avatar.',
          position: 'top',
          status: 'error',
        });
        return;
      }

      const characterMetadata = {
        name: characterName,
        description: characterDescription,
        image: `ipfs://${cid}`,
      };

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

        const encodedCharacterCreationData = encodeAbiParameters(
          [
            {
              name: 'name',
              type: 'string',
            },
            {
              name: 'tokenUri',
              type: 'string',
            },
          ],
          [characterName, characterMetadataCid],
        );

        const transactionhash = await walletClient.writeContract({
          chain: walletClient.chain,
          account: walletClient.account?.address as Address,
          address: game.id as Address,
          abi: parseAbi([
            'function rollCharacterSheet(address _to, bytes calldata _data) external',
          ]),
          functionName: 'rollCharacterSheet',
          args: [
            walletClient.account?.address as Address,
            encodedCharacterCreationData,
          ],
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
      characterDescription,
      characterName,
      hasError,
      onUpload,
      publicClient,
      game,
      character,
      reloadGame,
      toast,
      walletClient,
    ],
  );

  const isLoading = isCreating;
  const isDisabled = isLoading || isUploading;

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
        {/* <FormControl isInvalid={showError && !characterAvatar}>
          <FormLabel>Character Avatar</FormLabel>
          {!characterAvatar && (
            <Input
              accept=".png, .jpg, .jpeg, .svg"
              disabled={isUploading}
              onChange={e => setCharacterAvatar(e.target.files?.[0] ?? null)}
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
        </FormControl> */}

        <SimpleGrid columns={4} spacing={0.5} w="100%">
          <Button
            border="3px solid black"
            onClick={() => setActiveTab('body')}
            p={4}
            size="sm"
            variant={activeTab === 'body' ? 'solid' : 'outline'}
            w="100%"
          >
            <Text>Body</Text>
          </Button>
          <Button
            border="3px solid black"
            onClick={() => setActiveTab('eyes')}
            p={4}
            size="sm"
            variant={activeTab === 'eyes' ? 'solid' : 'outline'}
            w="100%"
          >
            <Text>Eyes</Text>
          </Button>
          <Button
            border="3px solid black"
            onClick={() => setActiveTab('hair')}
            p={4}
            size="sm"
            variant={activeTab === 'hair' ? 'solid' : 'outline'}
            w="100%"
          >
            <Text>Hair</Text>
          </Button>
          <Button
            border="3px solid black"
            onClick={() => setActiveTab('mouth')}
            p={4}
            size="sm"
            variant={activeTab === 'mouth' ? 'solid' : 'outline'}
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
          h="600px"
          w="400px"
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

        <Button
          alignSelf="flex-end"
          isDisabled={isDisabled}
          isLoading={isLoading}
          loadingText="Creating..."
          type="submit"
        >
          Create
        </Button>
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
  activeTab: 'body' | 'eyes' | 'hair' | 'mouth';
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
      case 'body':
        return traits[0];
      case 'eyes':
        return traits[1];
      case 'hair':
        return traits[2];
      case 'mouth':
        return traits[3];
      default:
        return traits[0];
    }
  }, [activeTab, traits]);

  const activeTraits = useMemo(() => {
    switch (activeTab) {
      case 'body':
        return BODY_TRAITS;
      case 'eyes':
        return EYES_TRAITS;
      case 'hair':
        return HAIR_TRAITS;
      case 'mouth':
        return MOUTH_TRAITS;
      default:
        return [];
    }
  }, [activeTab]);

  const [, variant] = selectedTrait.split('_');

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
    <Flex gap={6}>
      <Button
        isDisabled={disablePrevious}
        onClick={onPreviousVariant}
        size="xs"
      >
        &#8592;
      </Button>
      <Text>{variant}</Text>
      <Button isDisabled={disableNext} onClick={onNextVariant} size="xs">
        &#8594;
      </Button>
    </Flex>
  );
};
