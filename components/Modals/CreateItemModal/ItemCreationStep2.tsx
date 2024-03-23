import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Image,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useMemo, useState } from 'react';
import { isAddress } from 'viem';

import {
  ClaimableAddress,
  ClaimableAddressListInput,
} from '@/components/ClaimableAddressListInput';
import { Switch } from '@/components/Switch';
import { useToast } from '@/hooks/useToast';

type Step2Props = {
  currentStep: number;
  setCurrentStep: (step: number) => void;

  claimableAddressList: ClaimableAddress[];
  setClaimableAddressList: React.Dispatch<
    React.SetStateAction<ClaimableAddress[]>
  >;

  soulboundToggle: boolean;
  setSoulboundToggle: React.Dispatch<React.SetStateAction<boolean>>;

  claimableToggle: boolean;
  setClaimableToggle: React.Dispatch<React.SetStateAction<boolean>>;

  itemSupply: string;
  itemDistribution: string;
};

export const ItemCreationStep2: React.FC<Step2Props> = ({
  currentStep,
  setCurrentStep,

  claimableAddressList,
  setClaimableAddressList,

  soulboundToggle,
  setSoulboundToggle,

  claimableToggle,
  setClaimableToggle,

  itemSupply,
  itemDistribution,
}) => {
  const invalidClaimableAddressList = useMemo(() => {
    const totalAmount = claimableAddressList.reduce(
      (acc, { amount }) => acc + BigInt(amount),
      BigInt(0),
    );

    if (totalAmount > BigInt(itemSupply)) return true;

    return claimableAddressList.some(
      ({ address, amount }) =>
        !isAddress(address) ||
        BigInt(amount) <= BigInt(0) ||
        BigInt(amount) > BigInt(itemDistribution) ||
        BigInt(amount).toString() === 'NaN',
    );
  }, [claimableAddressList, itemSupply, itemDistribution]);

  const hasError = useMemo(() => {
    return (
      //     invalidXpRequiredAmount
      invalidClaimableAddressList
    );
  }, [
    invalidClaimableAddressList,
    //   invalidXpRequiredAmount,
  ]);

  const [showError, setShowError] = useState<boolean>(false);

  const { renderError } = useToast();

  const onNext = useCallback(() => {
    if (hasError) {
      setShowError(true);
      renderError('Please fix the errors in the form');
      return;
    }

    setCurrentStep(currentStep + 1);
  }, [currentStep, hasError, renderError, setCurrentStep]);

  return (
    <VStack spacing={8} w="100%">
      <FormControl isInvalid={showError && !itemSupply}>
        <Flex align="center">
          <FormLabel>Is this item soulbound?</FormLabel>
          <Tooltip label="By making this item soulbound, you prevent characters who hold the item from ever being able to transfer it.">
            <Image
              alt="down arrow"
              height="14px"
              mb={2}
              src="/icons/question-mark.svg"
              width="14px"
            />
          </Tooltip>
        </Flex>
        <Switch
          isChecked={soulboundToggle}
          onChange={() => setSoulboundToggle(!soulboundToggle)}
        />
      </FormControl>

      <FormControl isInvalid={showError && !itemSupply}>
        <Flex align="center">
          <FormLabel>Allow players to claim?</FormLabel>
          <Tooltip label="If you don't allow players to claim, then items can only be given by the GameMaster.">
            <Image
              alt="down arrow"
              height="14px"
              mb={2}
              src="/icons/question-mark.svg"
              width="14px"
            />
          </Tooltip>
        </Flex>
        <Switch
          isChecked={claimableToggle}
          onChange={() => setClaimableToggle(!claimableToggle)}
        />
      </FormControl>

      {claimableToggle && (
        <ClaimableAddressListInput
          claimableAddressList={claimableAddressList}
          itemSupply={itemSupply}
          itemDistribution={itemDistribution}
          setClaimableAddressList={setClaimableAddressList}
        />
      )}

      <HStack w="100%" justify="flex-end" spacing={4}>
        {currentStep != 0 && (
          <Button
            variant="outline"
            onClick={() => setCurrentStep(currentStep - 1)}
          >
            Back
          </Button>
        )}
        <Button variant="solid" onClick={onNext}>
          Next
        </Button>
      </HStack>
    </VStack>
  );
};
