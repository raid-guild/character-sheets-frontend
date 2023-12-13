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
import { useClassActions } from '@/contexts/ClassActionsContext';
import { useGame } from '@/contexts/GameContext';
import { waitUntilBlock } from '@/graphql/health';
import { useToast } from '@/hooks/useToast';

export const LevelClassModal: React.FC = () => {
  const { game, reload: reloadGame, isMaster } = useGame();
  const { selectCharacter, selectedCharacter, levelClassModal } =
    useCharacterActions();
  const { selectedClass } = useClassActions();

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { renderError } = useToast();

  const [classId, setClassId] = useState<string>('0');

  const [isLeveling, setIsLeveling] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txFailed, setTxFailed] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSynced, setIsSynced] = useState<boolean>(false);

  const xpForNextLevel = useMemo(() => {
    const _class = selectedCharacter?.classes.find(c => c.classId === classId);
    if (!_class) return '0';
    return _class.xpForNextLevel;
  }, [classId, selectedCharacter]);

  const characterWithoutClass = useMemo(() => {
    if (selectedClass) {
      return selectedCharacter?.classes.find(
        c => c.classId === selectedClass.classId,
      )
        ? false
        : true;
    }
    return false;
  }, [selectedClass, selectedCharacter]);

  const insufficientXp = useMemo(() => {
    if (BigInt(selectedCharacter?.experience ?? '0') < BigInt(xpForNextLevel)) {
      return true;
    }
    return false;
  }, [selectedCharacter, xpForNextLevel]);

  const options = useMemo(() => {
    if (selectedClass) {
      return [selectedClass.classId];
    }
    return game?.classes.map(c => c.classId) ?? [];
  }, [selectedClass, game?.classes]);

  const { getRootProps, getRadioProps, setValue } = useRadioGroup({
    name: 'class',
    defaultValue: '0',
    onChange: setClassId,
  });
  const group = getRootProps();

  const resetData = useCallback(() => {
    if (selectedClass) {
      setValue(selectedClass.classId);
      setClassId(selectedClass.classId);
    } else {
      setValue(options[0]);
      setClassId(options[0]);
    }
    setIsLeveling(false);
    setTxHash(null);
    setTxFailed(false);
    setIsSyncing(false);
    setIsSynced(false);
  }, [selectedClass, options, setValue]);

  useEffect(() => {
    if (!levelClassModal?.isOpen) {
      resetData();
    }
  }, [resetData, levelClassModal?.isOpen]);

  const onLevelClass = useCallback(
    async (e: React.FormEvent<HTMLDivElement>) => {
      e.preventDefault();

      if (insufficientXp || characterWithoutClass) {
        return;
      }

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
      characterWithoutClass,
      classId,
      insufficientXp,
      isMaster,
      publicClient,
      game,
      reloadGame,
      renderError,
      selectedCharacter,
      walletClient,
    ],
  );

  const isLoading = isLeveling;
  const isDisabled =
    isLoading || insufficientXp || characterWithoutClass || !selectedCharacter;

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
        <Text>
          Current XP:{' '}
          {selectedCharacter
            ? selectedCharacter.experience
            : 'no character selected'}
        </Text>
        {selectedClass && selectedCharacter && characterWithoutClass && (
          <Text color="red.500">
            The selected character doesn&apos;t have the {selectedClass.name}{' '}
            class.
          </Text>
        )}
        <Flex {...group} wrap="wrap" gap={4}>
          {options.map(value => {
            const radio = getRadioProps({ value });
            const _class = selectedCharacter?.classes.find(
              c => c.classId === value,
            );
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
                  <Text fontSize="xs" textAlign="center">
                    Level {_class.level}
                  </Text>
                </VStack>
              </RadioCard>
            );
          })}
        </Flex>
        {selectedCharacter && (
          <Text>
            To level this class,{' '}
            <Text as="span" fontWeight={500}>
              {xpForNextLevel} XP
            </Text>{' '}
            must be staked.{' '}
            {insufficientXp && (
              <Text as="span" color="red.500">
                An additional{' '}
                {(
                  BigInt(xpForNextLevel) - BigInt(selectedCharacter.experience)
                ).toString()}{' '}
                XP is required.
              </Text>
            )}
          </Text>
        )}
        {selectedClass && game && (
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
