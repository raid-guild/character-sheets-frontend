import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  Link,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Address, isAddress, parseAbi } from 'viem';
import { useWalletClient } from 'wagmi';

import { useGameActions } from '@/contexts/GameActionsContext';
import { useGame } from '@/contexts/GameContext';

import { ActionModal } from './ActionModal';

export const AddGameMasterModal: React.FC = () => {
  const { game, isAdmin, reload: reloadGame } = useGame();
  const { addGameMasterModal } = useGameActions();

  const { data: walletClient } = useWalletClient();

  const [newGameMaster, setNewGameMaster] = useState<string>('');

  const [showError, setShowError] = useState<boolean>(false);
  const [isAdding, setIsAdding] = useState<boolean>(false);

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
  }, []);

  const onAddGameMaster = useCallback(async () => {
    if (hasError) {
      setShowError(true);
      return null;
    }
    if (!walletClient) throw new Error('Could not find a wallet client');
    if (!(game && game.gameMasterHatEligibilityModule))
      throw new Error('Missing game data');
    if (!isAdmin) throw new Error('You are not a game admin');

    try {
      setIsAdding(true);

      const transactionhash = await walletClient.writeContract({
        chain: walletClient.chain,
        account: walletClient.account?.address as Address,
        address: game.hatsAdaptor as Address,
        abi: parseAbi([
          'function addGameMasters(address[] calldata _addresses) external',
        ]),
        functionName: 'addGameMasters',
        args: [[newGameMaster as Address]],
      });
      return transactionhash;
    } catch (e) {
      throw e;
    } finally {
      setIsAdding(false);
    }
  }, [game, hasError, isAdmin, newGameMaster, walletClient]);

  const isLoading = isAdding;
  const isDisabled = isLoading;

  return (
    <ActionModal
      {...{
        isOpen: addGameMasterModal?.isOpen,
        onClose: addGameMasterModal?.onClose,
        header: 'Make Address Eligible as GameMaster',
        loadingText: `Adding GameMaster...`,
        successText: (
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
        ),
        errorText: 'There was an error adding the GameMaster.',
        resetData,
        onAction: onAddGameMaster,
        onComplete: reloadGame,
      }}
    >
      <VStack spacing={8}>
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
    </ActionModal>
  );
};
