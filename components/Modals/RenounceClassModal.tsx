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
import { TransactionPending } from '@/components/TransactionPending';
import { useCharacterActions } from '@/contexts/CharacterActionsContext';
import { useGame } from '@/contexts/GameContext';
import { waitUntilBlock } from '@/graphql/health';
import { useToast } from '@/hooks/useToast';
import { executeAsCharacter } from '@/utils/account';
import { Class } from '@/utils/types';

type RenounceClassModalProps = {
  classEntity?: Class;
};

export const RenounceClassModal: React.FC<RenounceClassModalProps> = ({
  classEntity,
}) => {
  const { character, game, reload: reloadGame } = useGame();
  const { renounceClassModal, selectedCharacter } = useCharacterActions();

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { renderError } = useToast();

  const [classId, setClassId] = useState<string>('1');

  const [isRenouncing, setIsRenouncing] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txFailed, setTxFailed] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSynced, setIsSynced] = useState<boolean>(false);

  const options = useMemo(() => {
    if (classEntity) {
      return [classEntity.classId];
    }
    return selectedCharacter?.classes.map(c => c.classId) ?? [];
  }, [classEntity, selectedCharacter?.classes]);

  const { getRootProps, getRadioProps, setValue } = useRadioGroup({
    name: 'class',
    defaultValue: options[0],
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
    setIsRenouncing(false);
    setTxHash(null);
    setTxFailed(false);
    setIsSyncing(false);
    setIsSynced(false);
  }, [classEntity, options, setValue]);

  useEffect(() => {
    if (!renounceClassModal?.isOpen) {
      resetData();
    }
  }, [resetData, renounceClassModal?.isOpen]);

  const onRenounceClass = useCallback(
    async (e: React.FormEvent<HTMLDivElement>) => {
      e.preventDefault();

      try {
        if (!walletClient) throw new Error('Could not find a wallet client');
        if (!selectedCharacter || selectedCharacter.id !== character?.id)
          throw new Error('Character address not found');
        if (!game?.classesAddress) throw new Error('Missing game data');
        if (selectedCharacter?.classes.length === 0)
          throw new Error('No classes found');

        setIsRenouncing(true);

        const transactionhash = await executeAsCharacter(
          character,
          walletClient,
          {
            chain: walletClient.chain,
            account: walletClient.account?.address as Address,
            address: game.classesAddress as Address,
            abi: parseAbi(['function renounceClass(uint256 classId) public']),
            functionName: 'renounceClass',
            args: [BigInt(classId)],
          },
        );
        setTxHash(transactionhash);

        const client = publicClient ?? walletClient;
        const { blockNumber, status } = await client.waitForTransactionReceipt({
          hash: transactionhash,
        });

        if (status === 'reverted') {
          setTxFailed(true);
          setIsRenouncing(false);
          throw new Error('Transaction failed');
        }

        setIsSyncing(true);
        const synced = await waitUntilBlock(client.chain.id, blockNumber);
        if (!synced) throw new Error('Something went wrong while syncing');

        setIsSynced(true);
        reloadGame();
      } catch (e) {
        renderError(e, 'Something went wrong renouncing class');
      } finally {
        setIsSyncing(false);
        setIsRenouncing(false);
      }
    },
    [
      character,
      classId,
      publicClient,
      game,
      reloadGame,
      renderError,
      selectedCharacter,
      walletClient,
    ],
  );

  const isLoading = isRenouncing;
  const isDisabled = isLoading;

  const content = () => {
    if (txFailed) {
      return (
        <VStack py={10} spacing={4}>
          <Text>Transaction failed.</Text>
          <Button onClick={renounceClassModal?.onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

    if (isSynced) {
      return (
        <VStack py={10} spacing={4}>
          <Text>Class successfully renounced!</Text>
          <Button onClick={renounceClassModal?.onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

    if (txHash && selectedCharacter) {
      return (
        <TransactionPending
          isSyncing={isSyncing}
          text={`Renouncing class...`}
          txHash={txHash}
          chainId={game?.chainId}
        />
      );
    }

    return (
      <VStack as="form" onSubmit={onRenounceClass} spacing={8}>
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
        <Button
          isDisabled={isDisabled}
          isLoading={isLoading}
          loadingText="Renouncing..."
          type="submit"
          variant="solid"
          alignSelf="flex-end"
        >
          Renounce
        </Button>
      </VStack>
    );
  };

  return (
    <Modal
      closeOnEsc={!isLoading}
      closeOnOverlayClick={!isLoading}
      isOpen={renounceClassModal?.isOpen ?? false}
      onClose={renounceClassModal?.onClose ?? (() => {})}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Text>Renounce a Class</Text>
          <ModalCloseButton size="lg" />
        </ModalHeader>
        <ModalBody>{content()}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
