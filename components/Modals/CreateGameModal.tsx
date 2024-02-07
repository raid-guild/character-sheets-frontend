import {
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Image,
  Input,
  Textarea,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  encodeAbiParameters,
  Hex,
  isAddress,
  parseAbi,
  zeroAddress,
} from 'viem';
import { Address, useAccount, useNetwork, useWalletClient } from 'wagmi';

import { useGamesContext } from '@/contexts/GamesContext';
import { useCharacterLimitMessage } from '@/hooks/useCharacterLimitMessage';
import { useGlobalForChain } from '@/hooks/useGlobal';
import { useUploadFile } from '@/hooks/useUploadFile';
import { getChainLabelFromId } from '@/lib/web3';
import { BASE_CHARACTER_URI } from '@/utils/constants';

import { ActionModal } from './ActionModal';

export const CreateGameModal: React.FC = () => {
  const { address } = useAccount();
  const { chain } = useNetwork();
  const { data: walletClient } = useWalletClient();
  const { data: globalInfo } = useGlobalForChain();
  const { gameFactory } = globalInfo || {};
  const { createGameModal: { isOpen, onClose } = {}, reload: reloadGames } =
    useGamesContext();

  const {
    file: gameEmblem,
    setFile: setGameEmblem,
    onRemove,
    onUpload,
    isUploading,
    isUploaded,
  } = useUploadFile({ fileName: 'gameEmblem' });

  const [gameName, setGameName] = useState<string>('');
  const [gameDescription, setGameDescription] = useState<string>('');
  const characterLimitMessage = useCharacterLimitMessage({
    characterLimit: 200,
    currentCharacterCount: gameDescription.length,
  });
  const [gameMasters, setGameMasters] = useState<string>('');
  const [daoAddress, setDaoAddress] = useState<string>('');

  const [showError, setShowError] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const invalidGameDescription = useMemo(() => {
    return gameDescription.length > 200 && !!gameDescription;
  }, [gameDescription]);

  const invalidGameMasterAddress = useMemo(() => {
    const addresses = gameMasters.split(',');
    const trimmedAddresses = addresses.map(address => address.trim());
    return (
      trimmedAddresses.some(address => !isAddress(address)) && !!gameMasters
    );
  }, [gameMasters]);

  const invalidDaoAddress = useMemo(() => {
    return !isAddress(daoAddress) && !!daoAddress;
  }, [daoAddress]);

  const hasError = useMemo(() => {
    return (
      !gameDescription ||
      !gameEmblem ||
      !gameMasters ||
      !gameName ||
      invalidDaoAddress ||
      invalidGameDescription ||
      invalidGameMasterAddress
    );
  }, [
    gameDescription,
    gameEmblem,
    gameMasters,
    gameName,
    invalidDaoAddress,
    invalidGameDescription,
    invalidGameMasterAddress,
  ]);

  useEffect(() => {
    setShowError(false);
  }, [daoAddress, gameMasters]);

  const resetData = useCallback(() => {
    setGameName('');
    setGameDescription('');
    setGameEmblem(null);
    setGameMasters(address ?? '');
    setDaoAddress('');
    setShowError(false);

    setIsCreating(false);
  }, [address, setGameEmblem]);

  const onCreateGame = useCallback(async (): Promise<Hex | null> => {
    if (hasError) {
      setShowError(true);
      return null;
    }

    if (!walletClient) throw new Error('Could not find a wallet client');
    if (!chain) throw new Error('Could not find connected chain');
    if (!gameFactory)
      throw new Error(
        `Missing game factory address for the ${walletClient.chain.name} network`,
      );

    const trimmedGameMasterAddresses = gameMasters
      .split(',')
      .map(address => address.trim()) as Address[];

    const trimmedDaoAddress = (daoAddress.trim() as Address) || zeroAddress;

    const cid = await onUpload();
    if (!cid)
      throw new Error('Something went wrong uploading your game emblem');

    const gameMetadata = {
      name: gameName,
      description: gameDescription,
      image: `ipfs://${cid}`,
    };

    setIsCreating(true);

    const res = await fetch('/api/uploadMetadata?name=gameMetadata.json', {
      method: 'POST',
      body: JSON.stringify(gameMetadata),
    });
    if (!res.ok)
      throw new Error('Something went wrong uploading your game metadata');

    const { cid: gameMetadataCid } = await res.json();
    if (!gameMetadataCid)
      throw new Error('Something went wrong uploading your game metadata');

    const encodedGameCreationData = encodeAbiParameters(
      [
        {
          name: 'characterSheetsMetadataUri',
          type: 'string',
        },
        {
          name: 'characterSheetsBaseUri',
          type: 'string',
        },
        {
          name: 'experienceBaseUri',
          type: 'string',
        },
        {
          name: 'classesBaseUri',
          type: 'string',
        },
      ],
      [
        `ipfs://${gameMetadataCid}`,
        `${BASE_CHARACTER_URI}${getChainLabelFromId(chain.id)}/`,
        'ipfs://',
        'ipfs://',
      ],
    );

    const encodedHatsData = encodeAbiParameters(
      [
        {
          name: 'hatsImgUri',
          type: 'string',
        },
        { name: 'topHatDescription', type: 'string' },
        {
          name: 'adminHatUri',
          type: 'string',
        },
        {
          name: 'adminHatDescription',
          type: 'string',
        },
        {
          name: 'gameHatUri',
          type: 'string',
        },
        {
          name: 'gameHatDescription',
          type: 'string',
        },
        {
          name: 'playerHatUri',
          type: 'string',
        },
        {
          name: 'playerHatDescription',
          type: 'string',
        },
        {
          name: 'characterHatUri',
          type: 'string',
        },
        {
          name: 'characterHatDescription',
          type: 'string',
        },
      ],
      [
        gameMetadata.image,
        'Top Hat',
        'ipfs://',
        'Admin Hat',
        'ipfs://',
        'Game Hat',
        'ipfs://',
        'Player Hat',
        'ipfs://',
        'Character Hat',
      ],
    );

    const adminAddresses = [walletClient.account?.address as Address];

    try {
      const txHash = await walletClient.writeContract({
        chain: walletClient.chain,
        account: walletClient.account?.address as Address,
        address: gameFactory as Address,
        abi: parseAbi([
          'function createAndInitialize(address dao,address[] calldata admins,address[] calldata dungeonMasters,bytes calldata encodedHatsStrings,bytes calldata sheetsStrings) public returns (address)',
        ]),
        functionName: 'createAndInitialize',
        args: [
          trimmedDaoAddress,
          adminAddresses,
          trimmedGameMasterAddresses,
          encodedHatsData,
          encodedGameCreationData,
        ],
      });
      return txHash;
    } catch (e) {
      throw e;
    } finally {
      setIsCreating(false);
    }
  }, [
    chain,
    daoAddress,
    gameDescription,
    gameFactory,
    gameMasters,
    gameName,
    hasError,
    onUpload,
    walletClient,
  ]);

  const isLoading = isCreating;
  const isDisabled = isLoading || isUploading;

  return (
    <ActionModal
      {...{
        isOpen,
        onClose,
        header: 'Create a Game',
        loadingText: 'Your game is being created...',
        successText: 'Your game was successfully created!',
        errorText: 'There was an error creating your game',
        resetData,
        onAction: onCreateGame,
        onComplete: reloadGames,
      }}
    >
      <VStack spacing={8}>
        <FormControl isInvalid={showError && !gameName}>
          <FormLabel>Game Name</FormLabel>
          <Input
            onChange={e => setGameName(e.target.value)}
            type="text"
            value={gameName}
          />
          {showError && !gameName && (
            <FormHelperText color="red">A game name is required</FormHelperText>
          )}
        </FormControl>
        <FormControl isInvalid={showError && !gameDescription}>
          <FormLabel>Game Description ({characterLimitMessage})</FormLabel>
          <Textarea
            onChange={e => setGameDescription(e.target.value)}
            value={gameDescription}
          />
          {showError && !gameDescription && (
            <FormHelperText color="red">
              A game description is required
            </FormHelperText>
          )}
          {showError && invalidGameDescription && (
            <FormHelperText color="red">
              Game description must be less than 200 characters
            </FormHelperText>
          )}
        </FormControl>
        <FormControl isInvalid={showError && !gameEmblem}>
          <FormLabel>Game Emblem</FormLabel>
          {!gameEmblem && (
            <Input
              accept=".png, .jpg, .jpeg, .svg"
              disabled={isUploading}
              onChange={e => setGameEmblem(e.target.files?.[0] ?? null)}
              type="file"
              variant="file"
            />
          )}
          {gameEmblem && (
            <Flex align="center" gap={10} mt={4}>
              <Image
                alt="game emblem"
                objectFit="contain"
                src={URL.createObjectURL(gameEmblem)}
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
          {showError && !gameEmblem && (
            <FormHelperText color="red">
              A game emblem is required
            </FormHelperText>
          )}
        </FormControl>
        <FormControl
          isInvalid={showError && (invalidGameMasterAddress || !gameMasters)}
        >
          <Flex align="center">
            <FormLabel>GameMasters (separate addresses by commas)</FormLabel>
            <Tooltip label="GameMasters act as admins for the entire game. They can do things like change settings, create classes, and create items.">
              <Image
                alt="down arrow"
                height="14px"
                mb={2}
                src="/icons/question-mark.svg"
                width="14px"
              />
            </Tooltip>
          </Flex>
          <Input
            onChange={e => setGameMasters(e.target.value)}
            type="text"
            value={gameMasters}
          />
          {showError && !gameMasters && (
            <FormHelperText color="red">
              A GameMaster address is required
            </FormHelperText>
          )}
          {showError && invalidGameMasterAddress && (
            <FormHelperText color="red">
              Invalid GameMaster address
            </FormHelperText>
          )}
        </FormControl>
        <FormControl isInvalid={showError && invalidDaoAddress}>
          <Flex align="center">
            <FormLabel>DAO Address (optional)</FormLabel>
            <Tooltip label="By adding a DAO address, you restrict who can create characters to only members of that DAO. If you do not provide a DAO address, anyone can create a character.">
              <Image
                alt="down arrow"
                height="14px"
                mb={2}
                src="/icons/question-mark.svg"
                width="14px"
              />
            </Tooltip>
          </Flex>
          <Input
            onChange={e => setDaoAddress(e.target.value)}
            type="text"
            value={daoAddress}
          />
          {showError && invalidDaoAddress && (
            <FormHelperText color="red">Invalid DAO address</FormHelperText>
          )}
        </FormControl>
        <Button
          alignSelf="flex-end"
          isDisabled={isDisabled}
          isLoading={isLoading}
          loadingText="Creating..."
          type="submit"
          variant="solid"
        >
          Create
        </Button>
      </VStack>
    </ActionModal>
  );
};
