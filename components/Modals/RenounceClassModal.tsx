import {
  Button,
  Flex,
  Image,
  Text,
  useRadioGroup,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useMemo, useState } from 'react';
import { Address, parseAbi } from 'viem';
import { useWalletClient } from 'wagmi';

import { RadioCard } from '@/components/RadioCard';
import { useCharacterActions } from '@/contexts/CharacterActionsContext';
import { useClassActions } from '@/contexts/ClassActionsContext';
import { useGame } from '@/contexts/GameContext';
import { executeAsCharacter } from '@/utils/account';

import { ActionModal } from './ActionModal';

export const RenounceClassModal: React.FC = () => {
  const { character, game, reload: reloadGame } = useGame();
  const { renounceClassModal } = useCharacterActions();
  const { selectedClass } = useClassActions();

  const { data: walletClient } = useWalletClient();

  const [classId, setClassId] = useState<string>('1');

  const [isRenouncing, setIsRenouncing] = useState<boolean>(false);

  const options = useMemo(() => {
    if (selectedClass) {
      return [selectedClass.classId];
    }
    return character?.heldClasses.map(c => c.classId) ?? [];
  }, [character, selectedClass]);

  const { getRootProps, getRadioProps, setValue } = useRadioGroup({
    name: 'class',
    defaultValue: options[0],
    onChange: setClassId,
  });
  const group = getRootProps();

  const resetData = useCallback(() => {
    if (selectedClass) {
      setValue(selectedClass.classId);
      setClassId(selectedClass.classId);
    } else {
      setValue(options[0]);
      setClassId(options[0]);
    }
    setIsRenouncing(false);
  }, [options, selectedClass, setValue]);

  const onRenounceClass = useCallback(async () => {
    try {
      if (!walletClient) throw new Error('Could not find a wallet client');
      if (!character) throw new Error('Character address not found');
      if (!game?.classesAddress) throw new Error('Missing game data');
      if (character?.heldClasses.length === 0)
        throw new Error('No classes found');

      setIsRenouncing(true);

      const transactionhash = await executeAsCharacter(
        character,
        walletClient,
        {
          chain: walletClient.chain,
          account: walletClient.account?.address as Address,
          address: game.classesAddress as Address,
          abi: parseAbi(['function renounceClass(uint256 classId) public']),
          functionName: 'renounceClass',
          args: [BigInt(classId)],
        },
      );
      return transactionhash;
    } catch (e) {
      throw e;
    } finally {
      setIsRenouncing(false);
    }
  }, [character, classId, game, walletClient]);

  const isLoading = isRenouncing;
  const isDisabled = isLoading;

  return (
    <ActionModal
      {...{
        isOpen: renounceClassModal?.isOpen,
        onClose: renounceClassModal?.onClose,
        header: `Renounce a Class`,
        loadingText: `Renouncing class...`,
        successText: 'Class successfully renounced!',
        errorText: 'There was an error renouncing your class.',
        resetData,
        onAction: onRenounceClass,
        onComplete: reloadGame,
      }}
    >
      <VStack spacing={8}>
        <Flex {...group} wrap="wrap" gap={4}>
          {options.map(value => {
            const radio = getRadioProps({ value });
            const _class = game?.classes.find(c => c.classId === value);
            if (!_class) return null;

            return (
              <RadioCard key={value} {...radio}>
                <VStack justify="space-between" h="100%">
                  <Image
                    alt={`${_class.name} image`}
                    h="70%"
                    objectFit="contain"
                    src={_class.image}
                    w="100%"
                  />
                  <Text textAlign="center">{_class.name}</Text>
                </VStack>
              </RadioCard>
            );
          })}
        </Flex>
        <Button
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
