import {
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Image,
  Input,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Address, maxUint256, parseAbi } from 'viem';
import { useWalletClient } from 'wagmi';

import { Dropdown } from '@/components/Dropdown';
import { useCharacterActions } from '@/contexts/CharacterActionsContext';
import { useGame } from '@/contexts/GameContext';

import { ActionModal } from './ActionModal';

export const DropExperienceModal: React.FC = () => {
  const { game, reload: reloadGame, isMaster } = useGame();
  const { selectedCharacter, giveExpModal } = useCharacterActions();

  const { data: walletClient } = useWalletClient();

  const [selectedXpType, setSelectedXpType] = useState<string>('0');
  const [amount, setAmount] = useState<string>('');

  const [showError, setShowError] = useState<boolean>(false);
  const [isDropping, setIsDropping] = useState<boolean>(false);

  const xpTypeOptions = useMemo(() => {
    const options: { [key: string]: string } = { '0': 'General XP' };
    const classIds = game?.classes.map(c => c.classId) ?? [];
    classIds.forEach(id => {
      options[id] =
        `${game?.classes.find(c => c.classId === id)?.name ?? ''} XP`;
    });
    return options;
  }, [game]);

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
    setSelectedXpType('0');
    setAmount('');
    setShowError(false);

    setIsDropping(false);
  }, []);

  const dropExp = useCallback(async () => {
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
  }, [amount, game, isMaster, selectedCharacter, walletClient]);

  const giveClassExp = useCallback(async () => {
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
        address: game.classesAddress as Address,
        abi: parseAbi([
          'function giveClassExp(address characterAccount, uint256 classId, uint256 amountOfExp) public',
        ]),
        functionName: 'giveClassExp',
        args: [character, BigInt(selectedXpType), amountBG],
      });

      return transactionhash;
    } catch (e) {
      throw e;
    } finally {
      setIsDropping(false);
    }
  }, [amount, game, isMaster, selectedCharacter, selectedXpType, walletClient]);

  const onGiveExp = useCallback(async () => {
    if (hasError) {
      setShowError(true);
      return null;
    }

    try {
      if (selectedXpType === '0') {
        return await dropExp();
      } else {
        return await giveClassExp();
      }
    } catch (e) {
      throw e;
    }
  }, [hasError, selectedXpType, dropExp, giveClassExp]);

  const isLoading = isDropping;
  const isDisabled = isLoading;

  return (
    <ActionModal
      {...{
        isOpen: giveExpModal?.isOpen,
        onClose: giveExpModal?.onClose,
        header: 'Give XP',
        loadingText: `Giving ${amount} ${selectedXpType === '0' ? 'XP' : xpTypeOptions[selectedXpType]} to ${selectedCharacter?.name}...`,
        successText: `${amount} ${selectedXpType === '0' ? 'XP' : xpTypeOptions[selectedXpType]} successfully given!`,
        errorText: 'There was an error giving XP.',
        resetData,
        onAction: onGiveExp,
        onComplete: reloadGame,
      }}
    >
      <VStack spacing={8} w="100%">
        <FormControl>
          <Flex align="center">
            <FormLabel>XP Type</FormLabel>
            <Tooltip label="General XP is not assigned to a specific class.">
              <Image
                alt="down arrow"
                height="14px"
                mb={2}
                src="/icons/question-mark.svg"
                width="14px"
              />
            </Tooltip>
          </Flex>
          <Dropdown
            options={Object.keys(xpTypeOptions)}
            optionsLabelMapping={xpTypeOptions}
            selectedOption={selectedXpType}
            setSelectedOption={setSelectedXpType as (option: string) => void}
          />
        </FormControl>
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
