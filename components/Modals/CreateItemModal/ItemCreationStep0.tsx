import {
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Image,
  Input,
  Textarea,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useMemo, useState } from 'react';
import { maxUint256 } from 'viem';

import { useCharacterLimitMessage } from '@/hooks/useCharacterLimitMessage';
import { useToast } from '@/hooks/useToast';

type Step0Props = {
  currentStep: number;
  setCurrentStep: (step: number) => void;

  itemName: string;
  setItemName: React.Dispatch<React.SetStateAction<string>>;

  itemDescription: string;
  setItemDescription: React.Dispatch<React.SetStateAction<string>>;

  itemSupply: string;
  setItemSupply: React.Dispatch<React.SetStateAction<string>>;

  itemDistribution: string;
  setItemDistribution: React.Dispatch<React.SetStateAction<string>>;
};

export const ItemCreationStep0: React.FC<Step0Props> = ({
  currentStep,
  setCurrentStep,

  itemName,
  setItemName,

  itemDescription,
  setItemDescription,

  itemSupply,
  setItemSupply,

  itemDistribution,
  setItemDistribution,
}) => {
  const characterLimitMessage = useCharacterLimitMessage({
    characterLimit: 200,
    currentCharacterCount: itemDescription.length,
  });

  const invalidItemDescription = useMemo(() => {
    return itemDescription.length > 200 && !!itemDescription;
  }, [itemDescription]);

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

  const [showError, setShowError] = useState<boolean>(false);

  const hasError = useMemo(() => {
    return (
      !itemDescription ||
      !itemName ||
      invalidItemDescription ||
      invalidItemSupply ||
      invalidItemDistribution
    );
  }, [
    itemDescription,
    itemName,
    invalidItemDescription,
    invalidItemSupply,
    invalidItemDistribution,
  ]);

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
      <FormControl isInvalid={showError && !itemName}>
        <FormLabel>Item Name</FormLabel>
        <Input
          onChange={e => setItemName(e.target.value)}
          type="text"
          value={itemName}
        />
        {showError && !itemName && (
          <FormHelperText color="red">An item name is required</FormHelperText>
        )}
      </FormControl>
      <FormControl isInvalid={showError && !itemDescription}>
        <FormLabel>Item Description ({characterLimitMessage})</FormLabel>
        <Textarea
          onChange={e => setItemDescription(e.target.value)}
          value={itemDescription}
        />
        {showError && !itemDescription && (
          <FormHelperText color="red">
            An item description is required
          </FormHelperText>
        )}
        {showError && invalidItemDescription && (
          <FormHelperText color="red">
            Item description must be less than 200 characters
          </FormHelperText>
        )}
      </FormControl>
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
