import { Button, Text, VStack } from '@chakra-ui/react';
import { useCallback, useState } from 'react';
import { Address, parseAbi } from 'viem';
import { useWalletClient } from 'wagmi';

import { useCharacterActions } from '@/contexts/CharacterActionsContext';
import { useGame } from '@/contexts/GameContext';

import { ActionModal } from './ActionModal';

export const JailPlayerModal: React.FC = () => {
  const { game, reload: reloadGame } = useGame();
  const { selectedCharacter, jailPlayerModal } = useCharacterActions();

  const { jailed } = selectedCharacter ?? {};

  const { data: walletClient } = useWalletClient();

  const [isJailing, setIsJailing] = useState<boolean>(false);

  const resetData = useCallback(() => {
    setIsJailing(false);
  }, []);

  const onJailPlayer = useCallback(async () => {
    try {
      if (!walletClient) throw new Error('Could not find a wallet client');
      if (!game) throw new Error('Missing game data');
      if (!selectedCharacter) throw new Error('Character not found');

      setIsJailing(true);

      const transactionhash = await walletClient.writeContract({
        chain: walletClient.chain,
        account: walletClient.account?.address as Address,
        address: game.id as Address,
        abi: parseAbi([
          'function jailPlayer(address playerAddress, bool throwInJail) public',
        ]),
        functionName: 'jailPlayer',
        args: [selectedCharacter.player as `0x${string}`, !jailed],
      });
      return transactionhash;
    } catch (e) {
      throw e;
    } finally {
      setIsJailing(false);
    }
  }, [game, jailed, selectedCharacter, walletClient]);

  const isLoading = isJailing;
  const isDisabled = isLoading;

  return (
    <ActionModal
      {...{
        isOpen: jailPlayerModal?.isOpen,
        onClose: jailPlayerModal?.onClose,
        header: jailed ? 'Free Character' : 'Jail Character',
        loadingText: `Approving character transfer...`,
        successText: `Success!`,
        errorText: `There was an error ${jailed ? 'freeing' : 'jailing'} ${
          selectedCharacter?.name
        }'s player.`,
        resetData,
        onAction: onJailPlayer,
        onComplete: reloadGame,
      }}
    >
      <VStack spacing={8}>
        <Text textAlign="center">
          Are you sure you want to {jailed ? 'free' : 'jail'}{' '}
          {selectedCharacter?.name}
          {`'`}s player?
        </Text>
        <Button
          autoFocus
          isDisabled={isDisabled}
          isLoading={isLoading}
          loadingText={`${jailed ? 'Freeing' : 'Jailing'}...`}
          type="submit"
          variant="solid"
          alignSelf="flex-end"
        >
          {jailed ? 'Free' : 'Jail'}
        </Button>
      </VStack>
    </ActionModal>
  );
};
