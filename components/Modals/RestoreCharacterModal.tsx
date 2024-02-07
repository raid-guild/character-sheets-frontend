import { Button, Text, VStack } from '@chakra-ui/react';
import { useCallback, useState } from 'react';
import { Address, parseAbi } from 'viem';
import { useWalletClient } from 'wagmi';

import { useGameActions } from '@/contexts/GameActionsContext';
import { useGame } from '@/contexts/GameContext';

import { ActionModal } from './ActionModal';

export const RestoreCharacterModal: React.FC = () => {
  const { character, game, reload: reloadGame } = useGame();
  const { restoreCharacterModal } = useGameActions();

  const { data: walletClient } = useWalletClient();

  const [isRestoring, setIsRestoring] = useState<boolean>(false);

  const resetData = useCallback(() => {
    setIsRestoring(false);
  }, []);

  const onRestoreCharacter = useCallback(async () => {
    try {
      if (!walletClient) throw new Error('Could not find a wallet client');
      if (!game) throw new Error('Missing game data');
      if (!character) throw new Error('Character not found');

      setIsRestoring(true);

      const transactionhash = await walletClient.writeContract({
        chain: walletClient.chain,
        account: walletClient.account?.address as Address,
        address: game.id as Address,
        abi: parseAbi(['function restoreSheet() external']),
        functionName: 'restoreSheet',
      });
      return transactionhash;
    } catch (e) {
      throw e;
    } finally {
      setIsRestoring(false);
    }
  }, [character, game, walletClient]);

  const isLoading = isRestoring;
  const isDisabled = isLoading;

  return (
    <ActionModal
      {...{
        isOpen: restoreCharacterModal?.isOpen,
        onClose: restoreCharacterModal?.onClose,
        header: `Restore Character`,
        loadingText: `Restoring character...`,
        successText: `Your character has been restored!`,
        errorText: `There was an error restoring your character.`,
        resetData,
        onAction: onRestoreCharacter,
        onComplete: reloadGame,
      }}
    >
      <VStack spacing={8}>
        <Text textAlign="center">
          Are you sure you want to restore your character?
        </Text>
        <Button
          autoFocus
          isDisabled={isDisabled}
          isLoading={isLoading}
          loadingText="Restoring..."
          type="submit"
          variant="solid"
          alignSelf="flex-end"
        >
          Restore
        </Button>
      </VStack>
    </ActionModal>
  );
};
