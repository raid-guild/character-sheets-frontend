import { Button, Text, VStack } from '@chakra-ui/react';
import { useCallback, useState } from 'react';
import { parseAbi } from 'viem';
import { Address, useWalletClient } from 'wagmi';

import { useCharacterActions } from '@/contexts/CharacterActionsContext';
import { useGame } from '@/contexts/GameContext';

import { ActionModal } from './ActionModal';

export const RenounceCharacterModal: React.FC = () => {
  const { game, reload: reloadGame } = useGame();
  const { selectedCharacter, renounceCharacterModal } = useCharacterActions();

  const { data: walletClient } = useWalletClient();

  const [isRenouncing, setIsRenouncing] = useState<boolean>(false);

  const resetData = useCallback(() => {
    setIsRenouncing(false);
  }, []);

  const onRenounceCharacter = useCallback(async () => {
    try {
      if (!walletClient) throw new Error('Could not find a wallet client');
      if (!game) throw new Error('Missing game data');
      if (!selectedCharacter) throw new Error('Character not found');

      setIsRenouncing(true);

      const transactionhash = await walletClient.writeContract({
        chain: walletClient.chain,
        account: walletClient.account?.address as Address,
        address: game.id as Address,
        abi: parseAbi(['function renounceSheet() public']),
        functionName: 'renounceSheet',
      });

      return transactionhash;
    } catch (e) {
      throw e;
    } finally {
      setIsRenouncing(false);
    }
  }, [game, selectedCharacter, walletClient]);

  const isLoading = isRenouncing;
  const isDisabled = isLoading;

  return (
    <ActionModal
      {...{
        isOpen: renounceCharacterModal?.isOpen,
        onClose: renounceCharacterModal?.onClose,
        header: `Renounce Character`,
        loadingText: `Renouncing character...`,
        successText: 'Character successfully renounced!',
        errorText: 'There was an error renouncing your character.',
        resetData,
        onAction: onRenounceCharacter,
        onComplete: reloadGame,
      }}
    >
      <VStack spacing={8}>
        <Text textAlign="center">
          Are you sure you want to renounce your character? You will still be
          able to restore your character in the future.
        </Text>
        <Button
          autoFocus
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
    </ActionModal>
  );
};
