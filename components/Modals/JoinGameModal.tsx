import {
  Button,
  // Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  // Image,
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
    'background' | 'body' | 'eyes' | 'hair' | 'mouth'
  >('background');

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

        <SimpleGrid columns={5} spacing={0.5} w="100%">
          <Button
            border="3px solid black"
            onClick={() => setActiveTab('background')}
            p={4}
            size="sm"
            variant={activeTab === 'background' ? 'solid' : 'outline'}
            w="100%"
          >
            <Text>Background</Text>
          </Button>
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
