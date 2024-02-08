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

export const RevokeClassModal: React.FC = () => {
  const { game, isMaster, reload: reloadGame } = useGame();
  const { selectCharacter, selectedCharacter, revokeClassModal } =
    useCharacterActions();
  const { selectedClass } = useClassActions();

  const { data: walletClient } = useWalletClient();

  const [classId, setClassId] = useState<string>('1');

  const [isRevoking, setIsRevoking] = useState<boolean>(false);

  const invalidClass = useMemo(() => {
    const selectedCharacterClasses =
      selectedCharacter?.classes.map(c => c.classId) ?? [];
    return !selectedCharacterClasses.includes(classId);
  }, [classId, selectedCharacter]);

  const options = useMemo(() => {
    if (selectedClass) {
      return [selectedClass.classId];
    }
    return selectedCharacter?.classes.map(c => c.classId) ?? [];
  }, [selectedClass, selectedCharacter?.classes]);

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
    setIsRevoking(false);
  }, [options, selectedClass, setValue]);

  const onRevokeClass = useCallback(async () => {
    if (invalidClass) {
      return null;
    }

    try {
      if (!walletClient) throw new Error('Could not find a wallet client');
      if (!selectedCharacter) throw new Error('Character address not found');
      if (!game?.classesAddress) throw new Error('Missing game data');
      if (selectedCharacter?.classes.length === 0)
        throw new Error('No classes found');
      if (!isMaster) throw new Error('Only a GameMaster can revoke classes');

      setIsRevoking(true);

      const { account } = selectedCharacter;
      const transactionhash = await walletClient.writeContract({
        chain: walletClient.chain,
        account: walletClient.account?.address as Address,
        address: game.classesAddress as Address,
        abi: parseAbi([
          'function revokeClass(address character, uint256 classId) public',
        ]),
        functionName: 'revokeClass',
        args: [account as `0x${string}`, BigInt(classId)],
      });
      return transactionhash;
    } catch (e) {
      throw e;
    } finally {
      setIsRevoking(false);
    }
  }, [classId, game, invalidClass, isMaster, selectedCharacter, walletClient]);

  const isLoading = isRevoking;
  const isDisabled = isLoading || invalidClass || !selectedCharacter;

  return (
    <ActionModal
      {...{
        isOpen: revokeClassModal?.isOpen,
        onClose: revokeClassModal?.onClose,
        header: `Revoke a Class`,
        loadingText: `Revoking class...`,
        successText: `Class successfully revoked!`,
        errorText: `There was an error revoking your class.`,
        resetData,
        onAction: onRevokeClass,
        onComplete: reloadGame,
      }}
    >
      <VStack spacing={8} w="100%">
        {!selectedCharacter && <Text>No character selected.</Text>}
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
        {selectedCharacter && invalidClass && (
          <Text color="red.500">
            The selected character does not have this class.
          </Text>
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
          loadingText="Revoking..."
          type="submit"
          variant="solid"
          alignSelf="flex-end"
        >
          Revoke
        </Button>
      </VStack>
    </ActionModal>
  );
};
