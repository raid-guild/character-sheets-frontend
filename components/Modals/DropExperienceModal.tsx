import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Address, maxUint256, parseAbi } from 'viem';
import { useWalletClient } from 'wagmi';

import { useCharacterActions } from '@/contexts/CharacterActionsContext';
import { useGame } from '@/contexts/GameContext';

import { ActionModal } from './ActionModal';

export const DropExperienceModal: React.FC = () => {
  const { game, reload: reloadGame, isMaster } = useGame();
  const { selectedCharacter, giveExpModal } = useCharacterActions();

  const { data: walletClient } = useWalletClient();

  const [amount, setAmount] = useState<string>('');

  const [showError, setShowError] = useState<boolean>(false);
  const [isDropping, setIsDropping] = useState<boolean>(false);

  const hasError = useMemo(
    () =>
      !amount ||
      BigInt(amount).toString() === 'NaN' ||
      BigInt(amount) <= BigInt(0) ||
      BigInt(amount) > maxUint256,
    [amount],
  );

  useEffect(() => {
    setShowError(false);
  }, [amount]);

  const resetData = useCallback(() => {
    setAmount('');
    setShowError(false);

    setIsDropping(false);
  }, []);

  const onDropExp = useCallback(async () => {
    if (hasError) {
      setShowError(true);
      return null;
    }

    try {
      if (!walletClient) throw new Error('Wallet client is not connected');
      if (!selectedCharacter) throw new Error('Character address not found');
      if (!game?.experienceAddress) throw new Error('Could not find the game');
      if (!isMaster) throw new Error('Not the game master');

      setIsDropping(true);

      const character = selectedCharacter.account as Address;
      const amountBG = BigInt(amount);

      const transactionhash = await walletClient.writeContract({
        chain: walletClient.chain,
        account: walletClient.account?.address as Address,
        address: game.experienceAddress as Address,
        abi: parseAbi([
          'function dropExp(address character, uint256 amount) public',
        ]),
        functionName: 'dropExp',
        args: [character, amountBG],
      });

      return transactionhash;
    } catch (e) {
      throw e;
    } finally {
      setIsDropping(false);
    }
  }, [amount, isMaster, hasError, game, selectedCharacter, walletClient]);

  const isLoading = isDropping;
  const isDisabled = isLoading;

  return (
    <ActionModal
      {...{
        isOpen: giveExpModal?.isOpen,
        onClose: giveExpModal?.onClose,
        header: 'Give XP',
        loadingText: `Giving ${amount} XP to ${selectedCharacter?.name}...`,
        successText: 'XP successfully given!',
        errorText: 'There was an error giving XP.',
        resetData,
        onAction: onDropExp,
        onComplete: reloadGame,
      }}
    >
      <VStack spacing={8} w="100%">
        <FormControl isInvalid={showError}>
          <FormLabel>Amount</FormLabel>
          <Input
            onChange={e => setAmount(e.target.value)}
            type="number"
            value={amount}
          />
          {showError && (
            <FormHelperText color="red">
              Please enter a valid amount
            </FormHelperText>
          )}
        </FormControl>
        <Button
          alignSelf="flex-end"
          isDisabled={isDisabled}
          isLoading={isLoading}
          loadingText="Giving..."
          type="submit"
          variant="solid"
        >
          Give
        </Button>
      </VStack>
    </ActionModal>
  );
};
