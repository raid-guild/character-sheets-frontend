import {
  Box,
  Button,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react';
import { HatsClient } from '@hatsprotocol/sdk-v1-core';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePublicClient, useWalletClient } from 'wagmi';

import { TransactionPending } from '@/components/TransactionPending';
import { useCharacterActions } from '@/contexts/CharacterActionsContext';
import { useClassActions } from '@/contexts/ClassActionsContext';
import { useGame } from '@/contexts/GameContext';
import { waitUntilBlock } from '@/graphql/health';
import { useToast } from '@/hooks/useToast';

export const ClaimElderHatModal: React.FC = () => {
  const { character, game, reload: reloadGame } = useGame();
  const { claimElderHatModal } = useCharacterActions();
  const { selectedClass } = useClassActions();

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { renderError } = useToast();

  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txFailed, setTxFailed] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSynced, setIsSynced] = useState<boolean>(false);

  const invalidClass = useMemo(() => {
    const selectedCharacterClasses =
      character?.classes.map(c => c.classId) ?? [];
    return !selectedCharacterClasses.includes(selectedClass?.classId ?? '');
  }, [character, selectedClass]);

  const resetData = useCallback(() => {
    setIsClaiming(false);
    setTxHash(null);
    setTxFailed(false);
    setIsSyncing(false);
    setIsSynced(false);
  }, []);

  useEffect(() => {
    if (!claimElderHatModal?.isOpen) {
      resetData();
    }
  }, [resetData, claimElderHatModal?.isOpen]);

  const onClaimElderHat = useCallback(
    async (e: React.FormEvent<HTMLDivElement>) => {
      e.preventDefault();

      if (invalidClass) {
        throw new Error('No class selected');
      }

      try {
        if (!walletClient) throw new Error('Could not find a wallet client');
        if (!character) throw new Error('Character address not found');
        if (!game?.classesAddress) throw new Error('Missing game data');
        if (game?.classes.length === 0) throw new Error('No classes found');

        setIsClaiming(true);

        const hatsClient = new HatsClient({
          chainId: walletClient.chain.id,
          publicClient,
          walletClient,
        });

        const account = walletClient.account.address;
        // TODO: get elder hat IDs dynamically
        const hatId = BigInt(
          '0x000000b900010001000200020000000000000000000000000000000000000000',
        );

        const canClaim = await hatsClient.accountCanClaim({
          account,
          hatId,
        });

        if (!canClaim) throw new Error('You cannot claim this hat');

        const claimHatResult = await hatsClient.claimHat({
          account,
          hatId,
        });

        const { transactionHash } = claimHatResult;

        setTxHash(transactionHash);

        const client = publicClient ?? walletClient;
        const { blockNumber, status } = await client.waitForTransactionReceipt({
          hash: transactionHash,
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
          `Something went wrong claiming the ${selectedClass?.name} Elder Hat.`,
        );
      } finally {
        setIsSyncing(false);
        setIsClaiming(false);
      }
    },
    [
      character,
      invalidClass,
      publicClient,
      game,
      reloadGame,
      renderError,
      selectedClass,
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
          <Button onClick={claimElderHatModal?.onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

    if (isSynced) {
      return (
        <VStack py={10} spacing={4}>
          <Text>Elder Hat successfully claimed!</Text>
          <Button onClick={claimElderHatModal?.onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

    if (txHash) {
      return (
        <TransactionPending
          isSyncing={isSyncing}
          text="Claiming Elder Hat..."
          txHash={txHash}
          chainId={game?.chainId}
        />
      );
    }

    return (
      <VStack as="form" onSubmit={onClaimElderHat} spacing={8}>
        {selectedClass && (
          <>
            <Text maxW="500px" textAlign="center">
              Claiming the {selectedClass?.name} Elder Hat will grant you
              abilities only available to the top{' '}
              {selectedClass?.name?.toLowerCase()}s in the guild.
            </Text>
            <Box
              background="black"
              border="3px solid black"
              color="white"
              fontWeight={600}
              h="200px"
              w={{ base: '120px', sm: '150px' }}
              px={5}
              py={3}
            >
              <VStack justify="space-between" h="100%">
                <Image
                  alt={`${selectedClass.name} image`}
                  h="70%"
                  objectFit="contain"
                  src={selectedClass.image}
                  w="100%"
                />
                <Text textAlign="center">{selectedClass.name}</Text>
              </VStack>
            </Box>
          </>
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
      isOpen={claimElderHatModal?.isOpen ?? false}
      onClose={claimElderHatModal?.onClose ?? (() => {})}
    >
      <ModalOverlay />
      <ModalContent mt={{ base: 0, md: '84px' }}>
        <ModalHeader>
          <Text>Claim Elder Hat</Text>
          <ModalCloseButton size="lg" />
        </ModalHeader>
        <ModalBody>{content()}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
