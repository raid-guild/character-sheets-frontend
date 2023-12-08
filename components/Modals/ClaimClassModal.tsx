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

type ClaimClassModalProps = {
  classEntity?: Class;
};

export const ClaimClassModal: React.FC<ClaimClassModalProps> = ({
  classEntity,
}) => {
  const { character, game, reload: reloadGame } = useGame();
  const { claimClassModal } = useCharacterActions();

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { renderError } = useToast();

  const [classId, setClassId] = useState<string>('0');

  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txFailed, setTxFailed] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSynced, setIsSynced] = useState<boolean>(false);

  const invalidClass = useMemo(() => {
    const selectedCharacterClasses =
      character?.classes.map(c => c.classId) ?? [];
    return selectedCharacterClasses.includes(classId);
  }, [character, classId]);

  const options = useMemo(() => {
    if (classEntity) {
      return [classEntity.classId];
    }
    return game?.classes.filter(c => c.claimable).map(c => c.classId) ?? [];
  }, [classEntity, game]);

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
    setIsClaiming(false);
    setTxHash(null);
    setTxFailed(false);
    setIsSyncing(false);
    setIsSynced(false);
  }, [classEntity, options, setValue]);

  useEffect(() => {
    if (!claimClassModal?.isOpen) {
      resetData();
    }
  }, [resetData, claimClassModal?.isOpen]);

  const onClaimClass = useCallback(
    async (e: React.FormEvent<HTMLDivElement>) => {
      e.preventDefault();

      if (invalidClass) {
        return;
      }

      try {
        if (!walletClient) throw new Error('Could not find a wallet client');

        if (!character) throw new Error('Character address not found');

        if (!game?.classesAddress) throw new Error('Missing game data');

        if (game?.classes.length === 0) throw new Error('No classes found');

        setIsClaiming(true);

        const transactionhash = await executeAsCharacter(
          character,
          walletClient,
          {
            chain: walletClient.chain,
            account: walletClient.account?.address as Address,
            address: game.classesAddress as Address,
            abi: parseAbi(['function claimClass(uint256 classId) external']),
            functionName: 'claimClass',
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
          setIsClaiming(false);
          throw new Error('Transaction failed');
        }

        setIsSyncing(true);
        const synced = await waitUntilBlock(client.chain.id, blockNumber);
        if (!synced) throw new Error('Something went wrong while syncing');

        setIsSynced(true);
        reloadGame();
      } catch (e) {
        renderError(
          e,
          `Something went wrong claiming ${character?.name} class.`,
        );
      } finally {
        setIsSyncing(false);
        setIsClaiming(false);
      }
    },
    [
      character,
      classId,
      invalidClass,
      publicClient,
      game,
      reloadGame,
      renderError,
      walletClient,
    ],
  );

  const isLoading = isClaiming;
  const isDisabled = isLoading || invalidClass;

  const content = () => {
    if (txFailed) {
      return (
        <VStack py={10} spacing={4}>
          <Text>Transaction failed.</Text>
          <Button onClick={claimClassModal?.onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

    if (isSynced) {
      return (
        <VStack py={10} spacing={4}>
          <Text>Class successfully claimed!</Text>
          <Button onClick={claimClassModal?.onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

    if (txHash) {
      return (
        <TransactionPending
          isSyncing={isSyncing}
          text="Claiming class..."
          txHash={txHash}
          chainId={game?.chainId}
        />
      );
    }

    return (
      <VStack as="form" onSubmit={onClaimClass} spacing={8}>
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
        {invalidClass && (
          <Text color="red.500">This class is already claimed.</Text>
        )}
        <Button
          isDisabled={isDisabled}
          isLoading={isLoading}
          loadingText="Claiming..."
          type="submit"
          variant="solid"
          alignSelf="flex-end"
        >
          Claim
        </Button>
      </VStack>
    );
  };

  return (
    <Modal
      closeOnEsc={!isLoading}
      closeOnOverlayClick={!isLoading}
      isOpen={claimClassModal?.isOpen ?? false}
      onClose={claimClassModal?.onClose ?? (() => {})}
    >
      <ModalOverlay />
      <ModalContent mt={{ base: 0, md: '84px' }}>
        <ModalHeader>
          <Text>Claim a Class</Text>
          <ModalCloseButton size="lg" />
        </ModalHeader>
        <ModalBody>{content()}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
