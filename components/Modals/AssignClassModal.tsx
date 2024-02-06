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
import { SelectCharacterInput } from '@/components/SelectCharacterInput';
import { useCharacterActions } from '@/contexts/CharacterActionsContext';
import { useClassActions } from '@/contexts/ClassActionsContext';
import { useGame } from '@/contexts/GameContext';

import { ActionModal } from './ActionModal';

export const AssignClassModal: React.FC = () => {
  const { game, reload: reloadGame, isMaster } = useGame();
  const { selectCharacter, selectedCharacter, assignClassModal } =
    useCharacterActions();
  const { selectedClass } = useClassActions();

  const { data: walletClient } = useWalletClient();

  const [classId, setClassId] = useState<string>('0');

  const [isAssigning, setIsAssigning] = useState<boolean>(false);

  const invalidClass = useMemo(() => {
    const selectedCharacterClasses =
      selectedCharacter?.classes.map(c => c.classId) ?? [];
    return selectedCharacterClasses.includes(classId);
  }, [classId, selectedCharacter]);

  const options = useMemo(() => {
    if (selectedClass) {
      return [selectedClass.classId];
    }
    return game?.classes.map(c => c.classId) ?? [];
  }, [game?.classes, selectedClass]);

  const { getRootProps, getRadioProps, setValue } = useRadioGroup({
    name: 'class',
    defaultValue: '0',
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
    setIsAssigning(false);
  }, [options, selectedClass, setValue]);

  const onAssignClass = useCallback(async () => {
    if (invalidClass) {
      return null;
    }

    if (!walletClient) throw new Error('Could not find a wallet client');

    if (!selectedCharacter) throw new Error('Character address not found');

    if (!game?.classesAddress) throw new Error('Missing game data');

    if (game?.classes.length === 0) throw new Error('No classes found');
    if (!isMaster) throw new Error('Not the game master');

    setIsAssigning(true);

    try {
      const txHash = await walletClient.writeContract({
        chain: walletClient.chain,
        account: walletClient.account?.address as Address,
        address: game.classesAddress as Address,
        abi: parseAbi([
          'function assignClass(address character, uint256 classId) public',
        ]),
        functionName: 'assignClass',
        args: [selectedCharacter.account as `0x${string}`, BigInt(classId)],
      });
      return txHash;
    } catch (e) {
      throw e;
    } finally {
      setIsAssigning(false);
    }
  }, [classId, isMaster, invalidClass, game, selectedCharacter, walletClient]);

  const isLoading = isAssigning;
  const isDisabled = isLoading || invalidClass || !selectedCharacter;

  return (
    <ActionModal
      {...{
        isOpen: assignClassModal?.isOpen,
        onClose: assignClassModal?.onClose,
        header: 'Assign a Class',
        loadingText: `Assigning the class to ${selectedCharacter?.name}...`,
        successText: 'Class successfully assigned!',
        errorText: 'There was an error assigning the class.',
        resetData,
        onAction: onAssignClass,
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
        {invalidClass && (
          <Text color="red.500">This class is already assigned.</Text>
        )}
        {selectedClass && game && (
          <VStack align="flex-start" w="full">
            <Text fontSize="sm" fontWeight={500}>
              Select a character
            </Text>
            <SelectCharacterInput
              characters={game.characters}
              selectedCharacter={selectedCharacter}
              setSelectedCharacter={selectCharacter}
            />
          </VStack>
        )}
        <Button
          isDisabled={isDisabled}
          isLoading={isLoading}
          loadingText="Assigning..."
          type="submit"
          variant="solid"
          alignSelf="flex-end"
        >
          Assign
        </Button>
      </VStack>
    </ActionModal>
  );
};
