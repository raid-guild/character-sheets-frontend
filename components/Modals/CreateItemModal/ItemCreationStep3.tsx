import { Button, HStack, VStack } from '@chakra-ui/react';

import { ItemCard } from '@/components/ItemCard';
import { Item } from '@/utils/types';

type Step3Props = {
  currentStep: number;
  setCurrentStep: (step: number) => void;

  itemToCreate: Item;

  isCreating: boolean;
};

export const ItemCreationStep3: React.FC<Step3Props> = ({
  currentStep,
  setCurrentStep,

  itemToCreate,

  isCreating,
}) => {
  return (
    <VStack spacing={8} w="100%">
      <ItemCard dummy {...itemToCreate} />
      <HStack w="100%" justify="flex-end" spacing={4}>
        <Button
          variant="outline"
          onClick={() => setCurrentStep(currentStep - 1)}
          size="sm"
          isDisabled={isCreating}
        >
          Back
        </Button>
        <Button
          isDisabled={isCreating}
          isLoading={isCreating}
          loadingText="Creating..."
          type="submit"
          variant="solid"
        >
          Create
        </Button>
      </HStack>
    </VStack>
  );
};
