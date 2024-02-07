import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Address, isAddress, parseAbi } from 'viem';
import { useWalletClient } from 'wagmi';

import { useCharacterActions } from '@/contexts/CharacterActionsContext';
import { useGame } from '@/contexts/GameContext';

import { ActionModal } from './ActionModal';

export const TransferCharacterModal: React.FC = () => {
  const { game, reload: reloadGame } = useGame();
  const { selectedCharacter, transferCharacterModal } = useCharacterActions();

  const { data: walletClient } = useWalletClient();

  const [newPlayer, setNewPlayer] = useState<string>('');

  const [showError, setShowError] = useState<boolean>(false);
  const [isTransferring, setIsTransferring] = useState<boolean>(false);

  const invalidPlayerAddress = useMemo(() => {
    return !isAddress(newPlayer) && !!newPlayer;
  }, [newPlayer]);

  const allPlayers = useMemo(() => {
    if (!game) return [];
    return game.characters.map(c => c.player);
  }, [game]);

  const newPlayerIsAlreadyPlayer = useMemo(() => {
    return allPlayers.includes(newPlayer.toLowerCase());
  }, [allPlayers, newPlayer]);

  const hasError = useMemo(() => {
    return !newPlayer || invalidPlayerAddress || newPlayerIsAlreadyPlayer;
  }, [newPlayer, invalidPlayerAddress, newPlayerIsAlreadyPlayer]);

  useEffect(() => {
    setShowError(false);
  }, [newPlayer]);

  const resetData = useCallback(() => {
    setNewPlayer('');

    setShowError(false);
    setIsTransferring(false);
  }, []);

  const gameOwner = useMemo(() => {
    if (!game) return null;
    return game.owner as Address;
  }, [game]);

  const onTransferCharacter = useCallback(async () => {
    if (hasError) {
      setShowError(true);
      return null;
    }

    try {
      if (!walletClient) throw new Error('Could not find a wallet client');
      if (!game) throw new Error('Missing game data');
      if (!selectedCharacter) throw new Error('Character not found');

      if (!gameOwner) throw new Error('Game owner not found');

      setIsTransferring(true);

      const transactionhash = await walletClient.writeContract({
        chain: walletClient.chain,
        account: walletClient.account?.address as Address,
        address: game.id as Address,
        abi: parseAbi([
          'function safeTransferFrom(address from, address to, uint256 characterId, bytes memory) public',
        ]),
        functionName: 'safeTransferFrom',
        args: [
          selectedCharacter.player as Address,
          newPlayer as Address,
          BigInt(selectedCharacter.characterId),
          '0x',
        ],
      });
      return transactionhash;
    } catch (e) {
      throw e;
    } finally {
      setIsTransferring(false);
    }
  }, [game, gameOwner, hasError, newPlayer, selectedCharacter, walletClient]);

  const isLoading = isTransferring;
  const isDisabled = isLoading;

  return (
    <ActionModal
      {...{
        isOpen: transferCharacterModal?.isOpen,
        onClose: transferCharacterModal?.onClose,
        header: `Transfer Character to New Player`,
        loadingText: `Transferring character...`,
        successText: `The character ${selectedCharacter?.name} has been transferred to a new player!`,
        errorText: `There was an error transferring the character to a new player.`,
        resetData,
        onAction: onTransferCharacter,
        onComplete: reloadGame,
      }}
    >
      <VStack spacing={8}>
        <FormControl isInvalid={showError && invalidPlayerAddress}>
          <FormLabel>New player address</FormLabel>
          <Input
            onChange={e => setNewPlayer(e.target.value)}
            type="text"
            value={newPlayer}
          />
          {showError && !newPlayer && (
            <FormHelperText color="red">
              New player address is required
            </FormHelperText>
          )}
          {showError && invalidPlayerAddress && (
            <FormHelperText color="red">Invalid player address</FormHelperText>
          )}
          {showError && !invalidPlayerAddress && newPlayerIsAlreadyPlayer && (
            <FormHelperText color="red">
              This player already owns a character in this game
            </FormHelperText>
          )}
        </FormControl>
        <Button
          autoFocus
          isDisabled={isDisabled}
          isLoading={isLoading}
          loadingText="Transferring..."
          type="submit"
          variant="solid"
          alignSelf="flex-end"
        >
          Transfer
        </Button>
      </VStack>
    </ActionModal>
  );
};
