import {
  Button,
  Flex,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  useRadioGroup,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { parseAbi } from 'viem';
import { Address, usePublicClient, useWalletClient } from 'wagmi';

import { RadioCard } from '@/components/RadioCard';
import { SelectCharacterInput } from '@/components/SelectCharacterInput';
import { TransactionPending } from '@/components/TransactionPending';
import { useCharacterActions } from '@/contexts/CharacterActionsContext';
import { useGame } from '@/contexts/GameContext';
import { waitUntilBlock } from '@/graphql/health';
import { useToast } from '@/hooks/useToast';
import { Class } from '@/utils/types';

type LevelClassModalProps = {
  classEntity?: Class;
};

export const LevelClassModal: React.FC<LevelClassModalProps> = ({
  classEntity,
}) => {
  const { game, reload: reloadGame, isMaster } = useGame();
  const { selectCharacter, selectedCharacter, levelClassModal } =
    useCharacterActions();

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { renderError } = useToast();

  const [classId, setClassId] = useState<string>('0');

  const [isLeveling, setIsLeveling] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txFailed, setTxFailed] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSynced, setIsSynced] = useState<boolean>(false);

  // CHANGE
  // const invalidClass = useMemo(() => {
  //   const selectedCharacterClasses =
  //     selectedCharacter?.classes.map(c => c.classId) ?? [];
  //   return selectedCharacterClasses.includes(classId);
  // }, [classId, selectedCharacter]);

  const options = useMemo(() => {
    if (classEntity) {
      return [classEntity.classId];
    }
    return game?.classes.map(c => c.classId) ?? [];
  }, [classEntity, game?.classes]);

  const { getRootProps, getRadioProps, setValue } = useRadioGroup({
    name: 'class',
    defaultValue: '0',
    onChange: setClassId,
  });
  const group = getRootProps();

  const resetData = useCallback(() => {
    if (classEntity) {
      setValue(classEntity.classId);
      setClassId(classEntity.classId);
    } else {
      setValue(options[0]);
      setClassId(options[0]);
    }
    setIsLeveling(false);
    setTxHash(null);
    setTxFailed(false);
    setIsSyncing(false);
    setIsSynced(false);
  }, [classEntity, options, setValue]);

  useEffect(() => {
    if (!levelClassModal?.isOpen) {
      resetData();
    }
  }, [resetData, levelClassModal?.isOpen]);

  const onLevelClass = useCallback(
    async (e: React.FormEvent<HTMLDivElement>) => {
      e.preventDefault();

      // if (invalidClass) {
      //   return;
      // }

      try {
        if (!walletClient) throw new Error('Could not find a wallet client');

        if (!selectedCharacter) throw new Error('Character address not found');

        if (!game?.classesAddress) throw new Error('Missing game data');

        if (game?.classes.length === 0) throw new Error('No classes found');
        if (!isMaster) throw new Error('Not the game master');

        setIsLeveling(true);

        const transactionhash = await walletClient.writeContract({
          chain: walletClient.chain,
          account: walletClient.account?.address as Address,
          address: game.classesAddress as Address,
          abi: parseAbi([
            'function levelClass(address character, uint256 classId) public',
          ]),
          functionName: 'levelClass',
          args: [selectedCharacter.account as `0x${string}`, BigInt(classId)],
        });

        setTxHash(transactionhash);

        const client = publicClient ?? walletClient;
        const { blockNumber, status } = await client.waitForTransactionReceipt({
          hash: transactionhash,
        });

        if (status === 'reverted') {
          setTxFailed(true);
          setIsLeveling(false);
          throw new Error('Transaction failed');
        }

        setIsSyncing(true);
        const synced = await waitUntilBlock(client.chain.id, blockNumber);
        if (!synced) throw new Error('Something went wrong while syncing');

        setIsSynced(true);
        reloadGame();
      } catch (e) {
        renderError(e, `Something went wrong leveling  class`);
      } finally {
        setIsSyncing(false);
        setIsLeveling(false);
      }
    },
    [
      classId,
      isMaster,
      // invalidClass,
      publicClient,
      game,
      reloadGame,
      renderError,
      selectedCharacter,
      walletClient,
    ],
  );

  const isLoading = isLeveling;
  const isDisabled = isLoading;

  const content = () => {
    if (txFailed) {
      return (
        <VStack py={10} spacing={4}>
          <Text>Transaction failed.</Text>
          <Button onClick={levelClassModal?.onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

    if (isSynced) {
      return (
        <VStack py={10} spacing={4}>
          <Text>Class successfully leveled!</Text>
          <Button onClick={levelClassModal?.onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

    if (txHash && selectedCharacter) {
      return (
        <TransactionPending
          isSyncing={isSyncing}
          text={`Leveling class for ${selectedCharacter.name}...`}
          txHash={txHash}
          chainId={game?.chainId}
        />
      );
    }

    return (
      <VStack as="form" onSubmit={onLevelClass} spacing={8}>
        <Flex {...group} wrap="wrap" gap={4}>
          {options.map(value => {
            const radio = getRadioProps({ value });
            const _class = game?.classes.find(c => c.classId === value);
            if (!_class) return null;

            return (
              <RadioCard key={value} {...radio}>
                <VStack justify="space-between" h="100%">
                  <Image
                    alt={`${_class.name} image`}
                    h="70%"
                    objectFit="contain"
                    src={_class.image}
                    w="100%"
                  />
                  <Text textAlign="center">{_class.name}</Text>
                </VStack>
              </RadioCard>
            );
          })}
        </Flex>
        {/* {invalidClass && (
          <Text color="red.500">This character requires ___ more XP to level up.</Text>
        )} */}
        {!!classEntity && !!game && (
          <VStack align="flex-start" w="full">
            <Text fontSize="sm" fontWeight={500}>
              Select a character
            </Text>
            <SelectCharacterInput
              characters={game.characters}
              selectedCharacter={selectedCharacter}
              setSelectedCharacter={selectCharacter}
            />
          </VStack>
        )}
        <Button
          isDisabled={isDisabled}
          isLoading={isLoading}
          loadingText="Leveling..."
          type="submit"
          variant="solid"
          alignSelf="flex-end"
        >
          Level
        </Button>
      </VStack>
    );
  };

  return (
    <Modal
      closeOnEsc={!isLoading}
      closeOnOverlayClick={!isLoading}
      isOpen={levelClassModal?.isOpen ?? false}
      onClose={levelClassModal?.onClose ?? (() => {})}
    >
      <ModalOverlay />
      <ModalContent mt={{ base: 0, md: '84px' }}>
        <ModalHeader>
          <Text>Level Class</Text>
          <ModalCloseButton size="lg" />
        </ModalHeader>
        <ModalBody>{content()}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
