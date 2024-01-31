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

export const RevokeClassModal: React.FC = () => {
  const { game, isMaster, reload: reloadGame } = useGame();
  const { selectCharacter, selectedCharacter, revokeClassModal } =
    useCharacterActions();
  const { selectedClass } = useClassActions();

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { renderError } = useToast();

  const [classId, setClassId] = useState<string>('1');

  const [isRevoking, setIsRevoking] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txFailed, setTxFailed] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSynced, setIsSynced] = useState<boolean>(false);

  const invalidClass = useMemo(() => {
    const selectedCharacterClasses =
      selectedCharacter?.classes.map(c => c.classId) ?? [];
    return !selectedCharacterClasses.includes(classId);
  }, [classId, selectedCharacter]);

  const options = useMemo(() => {
    if (selectedClass) {
      return [selectedClass.classId];
    }
    return selectedCharacter?.classes.map(c => c.classId) ?? [];
  }, [selectedClass, selectedCharacter?.classes]);

  const { getRootProps, getRadioProps, setValue } = useRadioGroup({
    name: 'class',
    defaultValue: options[0],
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
    setIsRevoking(false);
    setTxHash(null);
    setTxFailed(false);
    setIsSyncing(false);
    setIsSynced(false);
  }, [options, selectedClass, setValue]);

  useEffect(() => {
    if (!revokeClassModal?.isOpen) {
      resetData();
    }
  }, [resetData, revokeClassModal?.isOpen]);

  const onRevokeClass = useCallback(
    async (e: React.FormEvent<HTMLDivElement>) => {
      e.preventDefault();

      if (invalidClass) {
        return;
      }

      try {
        if (!walletClient) throw new Error('Could not find a wallet client');
        if (!selectedCharacter) throw new Error('Character address not found');
        if (!game?.classesAddress) throw new Error('Missing game data');
        if (selectedCharacter?.classes.length === 0)
          throw new Error('No classes found');
        if (!isMaster) throw new Error('Only a GameMaster can revoke classes');

        setIsRevoking(true);

        const { account } = selectedCharacter;
        const transactionhash = await walletClient.writeContract({
          chain: walletClient.chain,
          account: walletClient.account?.address as Address,
          address: game.classesAddress as Address,
          abi: parseAbi([
            'function revokeClass(address character, uint256 classId) public',
          ]),
          functionName: 'revokeClass',
          args: [account as `0x${string}`, BigInt(classId)],
        });
        setTxHash(transactionhash);

        const client = publicClient ?? walletClient;
        const { blockNumber, status } = await client.waitForTransactionReceipt({
          hash: transactionhash,
        });

        if (status === 'reverted') {
          setTxFailed(true);
          setIsRevoking(false);
          throw new Error('Transaction failed');
        }

        setIsSyncing(true);
        const synced = await waitUntilBlock(client.chain.id, blockNumber);
        if (!synced) throw new Error('Something went wrong while syncing');

        setIsSynced(true);
        reloadGame();
      } catch (e) {
        renderError(e, 'Something went wrong revoking class');
      } finally {
        setIsSyncing(false);
        setIsRevoking(false);
      }
    },
    [
      classId,
      game,
      invalidClass,
      isMaster,
      publicClient,
      reloadGame,
      renderError,
      selectedCharacter,
      walletClient,
    ],
  );

  const isLoading = isRevoking;
  const isDisabled = isLoading || invalidClass || !selectedCharacter;

  const content = () => {
    if (txFailed) {
      return (
        <VStack py={10} spacing={4}>
          <Text>Transaction failed.</Text>
          <Button onClick={revokeClassModal?.onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

    if (isSynced) {
      return (
        <VStack py={10} spacing={4}>
          <Text>Class successfully revoked!</Text>
          <Button onClick={revokeClassModal?.onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

    if (txHash && selectedCharacter) {
      return (
        <TransactionPending
          isSyncing={isSyncing}
          text={`Revoking class...`}
          txHash={txHash}
          chainId={game?.chainId}
        />
      );
    }

    return (
      <VStack as="form" onSubmit={onRevokeClass} spacing={8}>
        {!selectedCharacter && <Text>No character selected.</Text>}
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
        {selectedCharacter && invalidClass && (
          <Text color="red.500">
            The selected character does not have this class.
          </Text>
        )}
        {selectedCharacter && game && (
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
          loadingText="Revoking..."
          type="submit"
          variant="solid"
          alignSelf="flex-end"
        >
          Revoke
        </Button>
      </VStack>
    );
  };

  return (
    <Modal
      closeOnEsc={!isLoading}
      closeOnOverlayClick={!isLoading}
      isOpen={revokeClassModal?.isOpen ?? false}
      onClose={revokeClassModal?.onClose ?? (() => {})}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Text>Revoke a Class</Text>
          <ModalCloseButton size="lg" />
        </ModalHeader>
        <ModalBody>{content()}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
