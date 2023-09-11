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
  useToast,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { parseAbi } from 'viem';
import { Address, usePublicClient, useWalletClient } from 'wagmi';

import { RadioCard } from '@/components/RadioCard';
import { TransactionPending } from '@/components/TransactionPending';
import { useActions } from '@/contexts/ActionsContext';
import { useGame } from '@/contexts/GameContext';
import { waitUntilBlock } from '@/hooks/useGraphHealth';

export const AssignClassModal: React.FC = () => {
  const { game, reload: reloadGame, isMaster } = useGame();
  const { selectedCharacter, assignClassModal } = useActions();

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const toast = useToast();

  const [classId, setClassId] = useState<string>('1');

  const [isAssigning, setIsAssigning] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSynced, setIsSynced] = useState<boolean>(false);

  const invalidClass = useMemo(() => {
    const selectedCharacterClasses =
      selectedCharacter?.classes.map(c => c.classId) ?? [];
    return selectedCharacterClasses.includes(classId);
  }, [classId, selectedCharacter]);

  const options = game?.classes.map(c => c.classId) ?? [];
  const { getRootProps, getRadioProps, setValue } = useRadioGroup({
    name: 'class',
    defaultValue: '1',
    onChange: setClassId,
  });
  const group = getRootProps();

  const resetData = useCallback(() => {
    setValue('1');
    setClassId('1');
    setIsAssigning(false);
    setTxHash(null);
    setIsSyncing(false);
    setIsSynced(false);
  }, [setValue]);

  useEffect(() => {
    if (!assignClassModal?.isOpen) {
      resetData();
    }
  }, [resetData, assignClassModal?.isOpen]);

  const onAssignClass = useCallback(
    async (e: React.FormEvent<HTMLDivElement>) => {
      e.preventDefault();

      if (invalidClass) {
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

      if (!selectedCharacter) {
        toast({
          description: 'Character address not found.',
          position: 'top',
          status: 'error',
        });
        console.error('Character address not found.');
        return;
      }

      if (!game?.classesAddress) {
        toast({
          description: `Could not find the game.`,
          position: 'top',
          status: 'error',
        });
        console.error(`Missing game data.`);
        return;
      }

      if (game?.classes.length === 0) {
        toast({
          description: `No classes found.`,
          position: 'top',
          status: 'error',
        });
        console.error(`No classes found.`);
        return;
      }

      if (!isMaster) {
        toast({
          description: `Not the game master.`,
          position: 'top',
          status: 'error',
        });
        console.error(`Not the game master.`);
        return;
      }

      setIsAssigning(true);

      try {
        const { characterId } = selectedCharacter;
        const transactionhash = await walletClient.writeContract({
          chain: walletClient.chain,
          account: walletClient.account?.address as Address,
          address: game.classesAddress as Address,
          abi: parseAbi([
            'function assignClass(uint256 characterId, uint256 classId) public',
          ]),
          functionName: 'assignClass',
          args: [BigInt(characterId), BigInt(classId)],
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
          description: `Something went wrong assigning class to ${selectedCharacter.name}.`,
          position: 'top',
          status: 'error',
        });
        console.error(e);
      } finally {
        setIsSyncing(false);
        setIsAssigning(false);
      }
    },
    [
      classId,
      isMaster,
      invalidClass,
      publicClient,
      game,
      reloadGame,
      selectedCharacter,
      toast,
      walletClient,
    ],
  );

  const isLoading = isAssigning;
  const isDisabled = isLoading || invalidClass;

  const content = () => {
    if (isSynced) {
      return (
        <VStack py={10} spacing={4}>
          <Text>Class successfully assigned!</Text>
          <Button onClick={assignClassModal?.onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

    if (txHash && selectedCharacter) {
      return (
        <TransactionPending
          isSyncing={isSyncing}
          text={`Assigning the class to ${selectedCharacter.name}...`}
          txHash={txHash}
        />
      );
    }

    return (
      <VStack as="form" onSubmit={onAssignClass} spacing={8}>
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
                  <Text>{_class.name}</Text>
                </VStack>
              </RadioCard>
            );
          })}
        </Flex>
        {invalidClass && (
          <Text color="red.500">This class is already assigned.</Text>
        )}
        <Button
          isDisabled={isDisabled}
          isLoading={isLoading}
          loadingText="Assigning..."
          type="submit"
        >
          Assign
        </Button>
      </VStack>
    );
  };

  return (
    <Modal
      closeOnEsc={!isLoading}
      closeOnOverlayClick={!isLoading}
      isOpen={assignClassModal?.isOpen ?? false}
      onClose={assignClassModal?.onClose ?? (() => {})}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Text>Assign a Class</Text>
          <ModalCloseButton size="lg" />
        </ModalHeader>
        <ModalBody>{content()}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
