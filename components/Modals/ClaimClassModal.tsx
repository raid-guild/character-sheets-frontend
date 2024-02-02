import {
  Button,
  Flex,
  Image,
  Text,
  useRadioGroup,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useMemo, useState } from 'react';
import { parseAbi } from 'viem';
import { Address, useWalletClient } from 'wagmi';

import { RadioCard } from '@/components/RadioCard';
import { useCharacterActions } from '@/contexts/CharacterActionsContext';
import { useClassActions } from '@/contexts/ClassActionsContext';
import { useGame } from '@/contexts/GameContext';
import { executeAsCharacter } from '@/utils/account';

import { ActionModal } from './ActionModal';

export const ClaimClassModal: React.FC = () => {
  const { character, game, reload: reloadGame } = useGame();
  const { claimClassModal } = useCharacterActions();
  const { selectedClass } = useClassActions();

  const { data: walletClient } = useWalletClient();

  const [classId, setClassId] = useState<string>('0');

  const [isClaiming, setIsClaiming] = useState<boolean>(false);

  const invalidClass = useMemo(() => {
    const selectedCharacterClasses =
      character?.classes.map(c => c.classId) ?? [];
    return selectedCharacterClasses.includes(classId);
  }, [character, classId]);

  const options = useMemo(() => {
    if (selectedClass) {
      return [selectedClass.classId];
    }
    return game?.classes.filter(c => c.claimable).map(c => c.classId) ?? [];
  }, [game, selectedClass]);

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
    setIsClaiming(false);
  }, [options, selectedClass, setValue]);

  const onClaimClass = useCallback(async () => {
    if (invalidClass) {
      return null;
    }

    if (!walletClient) throw new Error('Could not find a wallet client');

    if (!character) throw new Error('Character address not found');

    if (!game?.classesAddress) throw new Error('Missing game data');

    if (game?.classes.length === 0) throw new Error('No classes found');

    setIsClaiming(true);

    try {
      const transactionhash = await executeAsCharacter(
        character,
        walletClient,
        {
          chain: walletClient.chain,
          account: walletClient.account?.address as Address,
          address: game.classesAddress as Address,
          abi: parseAbi(['function claimClass(uint256 classId) external']),
          functionName: 'claimClass',
          args: [BigInt(classId)],
        },
      );

      return transactionhash;
    } catch (e) {
      throw e;
    } finally {
      setIsClaiming(false);
    }
  }, [character, classId, invalidClass, game, walletClient]);

  const isLoading = isClaiming;
  const isDisabled = isLoading || invalidClass;

  return (
    <ActionModal
      {...{
        isOpen: claimClassModal?.isOpen,
        onClose: claimClassModal?.onClose,
        header: 'Claim an Class',
        loadingText: `Claiming class...`,
        successText: 'Class successfully claimed!',
        errorText: 'There was an error claiming this class.',
        resetData,
        onAction: onClaimClass,
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
          <Text color="red.500">This class is already claimed.</Text>
        )}
        <Button
          isDisabled={isDisabled}
          isLoading={isLoading}
          loadingText="Claiming..."
          type="submit"
          variant="solid"
          alignSelf="flex-end"
        >
          Claim
        </Button>
      </VStack>
    </ActionModal>
  );
};
