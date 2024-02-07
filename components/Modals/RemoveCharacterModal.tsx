import { Button, Text } from '@chakra-ui/react';
import { useCallback, useState } from 'react';
import { parseAbi } from 'viem';
import { Address, useWalletClient } from 'wagmi';

import { useCharacterActions } from '@/contexts/CharacterActionsContext';
import { useGame } from '@/contexts/GameContext';

import { ActionModal } from './ActionModal';

export const RemoveCharacterModal: React.FC = () => {
  const { game, reload: reloadGame } = useGame();
  const { selectedCharacter, removeCharacterModal } = useCharacterActions();

  const { data: walletClient } = useWalletClient();

  const [isRemoving, setIsRemoving] = useState<boolean>(false);

  const resetData = useCallback(() => {
    setIsRemoving(false);
  }, []);

  const onRemoveSheet = useCallback(async () => {
    if (!walletClient) throw new Error('Could not find a wallet client');
    if (!game) throw new Error('Missing game data');
    if (!selectedCharacter) throw new Error('Character not found');
    if (!selectedCharacter.jailed)
      throw new Error('Player must be jailed be sheet is removed');

    setIsRemoving(true);

    try {
      const transactionhash = await walletClient.writeContract({
        chain: walletClient.chain,
        account: walletClient.account?.address as Address,
        address: game.id as Address,
        abi: parseAbi(['function removeSheet(uint256 characterId) public']),
        functionName: 'removeSheet',
        args: [BigInt(selectedCharacter.characterId)],
      });

      return transactionhash;
    } catch (e) {
      throw e;
    } finally {
      setIsRemoving(false);
    }
  }, [game, selectedCharacter, walletClient]);

  const isLoading = isRemoving;
  const isDisabled = isLoading;

  return (
    <ActionModal
      {...{
        isOpen: removeCharacterModal?.isOpen,
        onClose: removeCharacterModal?.onClose,
        header: 'Remove Character',
        loadingText: `Removing ${selectedCharacter?.name}...`,
        successText: 'Character successfully removed!',
        errorText: 'There was an error removing the character.',
        resetData,
        onAction: onRemoveSheet,
        onComplete: reloadGame,
      }}
    >
      <Text textAlign="center">
        Are you sure you want to remove {selectedCharacter?.name}? This action
        is irreversible.
      </Text>
      <Button
        autoFocus
        isDisabled={isDisabled}
        isLoading={isLoading}
        loadingText="Removing..."
        type="submit"
        variant="solid"
        alignSelf="flex-end"
      >
        Remove
      </Button>
    </ActionModal>
  );
};
