import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { isAddress, parseAbi } from 'viem';
import { Address, usePublicClient, useWalletClient } from 'wagmi';

import { TransactionPending } from '@/components/TransactionPending';
import { useGameActions } from '@/contexts/GameActionsContext';
import { useGame } from '@/contexts/GameContext';
import { waitUntilBlock } from '@/graphql/health';
import { useToast } from '@/hooks/useToast';

export const AddGameMasterModal: React.FC = () => {
  const { game, isAdmin, reload: reloadGame } = useGame();
  const { addGameMasterModal } = useGameActions();

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { renderError } = useToast();

  const [newGameMaster, setNewGameMaster] = useState<string>('');

  const [showError, setShowError] = useState<boolean>(false);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txFailed, setTxFailed] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSynced, setIsSynced] = useState<boolean>(false);

  const invalidGameMasterAddress = useMemo(() => {
    return !isAddress(newGameMaster.trim());
  }, [newGameMaster]);

  const alreadyGameMaster = useMemo(() => {
    return game?.masters.some(
      master => master === newGameMaster.trim().toLowerCase(),
    );
  }, [game, newGameMaster]);

  const hasError = useMemo(() => {
    return !newGameMaster || invalidGameMasterAddress || alreadyGameMaster;
  }, [alreadyGameMaster, newGameMaster, invalidGameMasterAddress]);

  useEffect(() => {
    setShowError(false);
  }, [newGameMaster]);

  const resetData = useCallback(() => {
    setNewGameMaster('');

    setShowError(false);
    setIsAdding(false);
    setTxHash(null);
    setTxFailed(false);
    setIsSyncing(false);
    setIsSynced(false);
  }, []);

  useEffect(() => {
    if (!addGameMasterModal?.isOpen) {
      resetData();
    }
  }, [resetData, addGameMasterModal]);

  const onAddGameMaster = useCallback(
    async (e: React.FormEvent<HTMLDivElement>) => {
      e.preventDefault();

      if (hasError) {
        setShowError(true);
        return;
      }

      try {
        if (!walletClient) throw new Error('Could not find a wallet client');
        if (!(game && game.gameMasterHatEligibilityModule))
          throw new Error('Missing game data');
        if (!isAdmin) throw new Error('You are not a game admin');

        setIsAdding(true);

        const transactionhash = await walletClient.writeContract({
          chain: walletClient.chain,
          account: walletClient.account?.address as Address,
          address: game.gameMasterHatEligibilityModule as Address,
          abi: parseAbi([
            'function addEligibleAddresses(address[] calldata _addresses) external',
          ]),
          functionName: 'addEligibleAddresses',
          args: [[newGameMaster as Address]],
        });
        setTxHash(transactionhash);

        const client = publicClient ?? walletClient;
        const { blockNumber, status } = await client.waitForTransactionReceipt({
          hash: transactionhash,
        });

        if (status === 'reverted') {
          setTxFailed(true);
          setIsAdding(false);
          throw new Error('Transaction failed');
        }

        setIsSyncing(true);
        const synced = await waitUntilBlock(client.chain.id, blockNumber);
        if (!synced) throw new Error('Something went wrong while syncing');

        setIsSynced(true);
        reloadGame();
      } catch (e) {
        renderError(e, `Something went wrong while adding a new GameMaster.`);
      } finally {
        setIsSyncing(false);
        setIsAdding(false);
      }
    },
    [
      game,
      hasError,
      isAdmin,
      newGameMaster,
      publicClient,
      reloadGame,
      renderError,
      walletClient,
    ],
  );

  const isLoading = isAdding;
  const isDisabled = isLoading;

  const content = () => {
    if (txFailed) {
      return (
        <VStack py={10} spacing={4}>
          <Text>Transaction failed.</Text>
          <Button onClick={addGameMasterModal?.onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

    if (isSynced) {
      return (
        <VStack py={10} spacing={4}>
          <Text fontSize="sm" textAlign="center">
            GameMaster eligibility updated! However, to complete the process of
            adding a new GameMaster, you must go to{' '}
            <Link
              href="https://app.hatsprotocol.xyz/"
              isExternal
              textDecor="underline"
            >
              Hats Protocol
            </Link>{' '}
            and give a GameMaster hat to the newly eligible address.
          </Text>
          <Button
            mt={4}
            onClick={addGameMasterModal?.onClose}
            variant="outline"
          >
            Close
          </Button>
        </VStack>
      );
    }

    if (txHash) {
      return (
        <TransactionPending
          isSyncing={isSyncing}
          text="Adding GameMaster..."
          txHash={txHash}
        />
      );
    }

    return (
      <VStack as="form" onSubmit={onAddGameMaster} spacing={8}>
        <FormControl isInvalid={showError && invalidGameMasterAddress}>
          <FormLabel>Additional GameMaster address</FormLabel>
          <Input
            onChange={e => setNewGameMaster(e.target.value)}
            type="text"
            value={newGameMaster}
          />
          {showError && !newGameMaster && (
            <FormHelperText color="red">
              A GameMaster address is required
            </FormHelperText>
          )}
          {showError && invalidGameMasterAddress && (
            <FormHelperText color="red">
              Invalid GameMaster address
            </FormHelperText>
          )}
          {showError && !invalidGameMasterAddress && alreadyGameMaster && (
            <FormHelperText color="red">
              This address is already a GameMaster
            </FormHelperText>
          )}
        </FormControl>
        <Button
          autoFocus
          isDisabled={isDisabled}
          isLoading={isLoading}
          loadingText="Adding..."
          type="submit"
          variant="solid"
          alignSelf="flex-end"
        >
          Add
        </Button>
      </VStack>
    );
  };

  return (
    <Modal
      closeOnEsc={!isLoading}
      closeOnOverlayClick={!isLoading}
      isOpen={addGameMasterModal?.isOpen ?? false}
      onClose={addGameMasterModal?.onClose ?? (() => {})}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Text>Make Address Eligible as GameMaster</Text>
          <ModalCloseButton size="lg" />
        </ModalHeader>
        <ModalBody>{content()}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
