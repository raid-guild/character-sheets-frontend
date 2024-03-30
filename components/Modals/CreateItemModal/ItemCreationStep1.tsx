import {
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Image,
  Input,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useMemo, useState } from 'react';
import { isAddress, maxUint256 } from 'viem';

import { Switch } from '@/components/Switch';
import {
  WhitelistAddress,
  WhitelistAddressListInput,
} from '@/components/WhitelistAddressListInput';
import { useToast } from '@/hooks/useToast';

type Step1Props = {
  currentStep: number;
  setCurrentStep: (step: number) => void;

  whitelistAddressList: WhitelistAddress[];
  setWhitelistAddressList: React.Dispatch<
    React.SetStateAction<WhitelistAddress[]>
  >;

  soulboundToggle: boolean;
  setSoulboundToggle: React.Dispatch<React.SetStateAction<boolean>>;

  whitelistToggle: boolean;
  setWhitelistToggle: React.Dispatch<React.SetStateAction<boolean>>;

  itemSupply: string;
  setItemSupply: React.Dispatch<React.SetStateAction<string>>;

  itemDistribution: string;
  setItemDistribution: React.Dispatch<React.SetStateAction<string>>;
};

export const ItemCreationStep1: React.FC<Step1Props> = ({
  currentStep,
  setCurrentStep,

  whitelistAddressList,
  setWhitelistAddressList,

  soulboundToggle,
  setSoulboundToggle,

  whitelistToggle,
  setWhitelistToggle,

  itemSupply,
  setItemSupply,

  itemDistribution,
  setItemDistribution,
}) => {
  const invalidWhitelistAddressList = useMemo(() => {
    const totalAmount = whitelistAddressList.reduce(
      (acc, { amount }) => acc + BigInt(amount),
      BigInt(0),
    );

    if (totalAmount > BigInt(itemSupply)) return true;

    return whitelistAddressList.some(
      ({ address, amount }) =>
        !isAddress(address) ||
        BigInt(amount) <= BigInt(0) ||
        BigInt(amount) > BigInt(itemDistribution) ||
        BigInt(amount).toString() === 'NaN',
    );
  }, [whitelistAddressList, itemSupply, itemDistribution]);

  const invalidItemSupply = useMemo(() => {
    return (
      !itemSupply ||
      BigInt(itemSupply).toString() === 'NaN' ||
      BigInt(itemSupply) <= BigInt(0) ||
      BigInt(itemSupply) > maxUint256
    );
  }, [itemSupply]);

  const invalidItemDistribution = useMemo(() => {
    return (
      !itemDistribution ||
      BigInt(itemDistribution).toString() === 'NaN' ||
      BigInt(itemDistribution) <= BigInt(0) ||
      BigInt(itemDistribution) > maxUint256 ||
      BigInt(itemDistribution) > BigInt(itemSupply)
    );
  }, [itemDistribution, itemSupply]);

  const hasError = useMemo(() => {
    return (
      invalidWhitelistAddressList ||
      invalidItemSupply ||
      invalidItemDistribution
    );
  }, [invalidWhitelistAddressList, invalidItemSupply, invalidItemDistribution]);

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
        <FormLabel>Item Supply</FormLabel>
        <Input
          onChange={e => setItemSupply(e.target.value)}
          type="number"
          value={itemSupply}
        />
        {showError && !itemSupply && (
          <FormHelperText color="red">
            An item supply is required
          </FormHelperText>
        )}
        {showError && invalidItemSupply && (
          <FormHelperText color="red">
            Item supply must be a number greater than 0
          </FormHelperText>
        )}
      </FormControl>
      <FormControl isInvalid={showError && !itemDistribution}>
        <Flex align="center">
          <FormLabel>Item Distribution</FormLabel>
          <Tooltip label="The max amount of items that a single player can hold.">
            <Image
              alt="down arrow"
              height="14px"
              mb={2}
              src="/icons/question-mark.svg"
              width="14px"
            />
          </Tooltip>
        </Flex>
        <Input
          onChange={e => setItemDistribution(e.target.value)}
          type="number"
          value={itemDistribution}
        />
        {showError && !itemDistribution && (
          <FormHelperText color="red">
            An item distribution is required
          </FormHelperText>
        )}
        {showError && invalidItemDistribution && (
          <FormHelperText color="red">
            Item distribution must be a number greater than 0 and less than or
            equal to the item supply
          </FormHelperText>
        )}
      </FormControl>
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
          <FormLabel>Allow players to obtain?</FormLabel>
          <Tooltip label="If you don't allow players to obtain, then items can only be given by the GameMaster.">
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
          isChecked={whitelistToggle}
          onChange={() => setWhitelistToggle(!whitelistToggle)}
        />
      </FormControl>

      {whitelistToggle && (
        <WhitelistAddressListInput
          whitelistAddressList={whitelistAddressList}
          itemSupply={itemSupply}
          itemDistribution={itemDistribution}
          setWhitelistAddressList={setWhitelistAddressList}
        />
      )}

      <HStack w="100%" justify="flex-end" spacing={4}>
        <Button
          variant="outline"
          onClick={() => setCurrentStep(currentStep - 1)}
        >
          Back
        </Button>
        <Button variant="solid" onClick={onNext}>
          Next
        </Button>
      </HStack>
    </VStack>
  );
};
