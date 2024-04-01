import { Button, HStack, VStack } from '@chakra-ui/react';

import { ItemCard } from '@/components/ItemCard';
import { Item } from '@/utils/types';

type Step4Props = {
  currentStep: number;
  setCurrentStep: (step: number) => void;

  itemToCreate: Item;

  isCreating: boolean;
};

export const ItemCreationStep4: React.FC<Step4Props> = ({
  currentStep,
  setCurrentStep,

  itemToCreate,

  isCreating,
}) => {
  return (
    <VStack spacing={8} w="100%">
      <ItemCard dummy {...itemToCreate} />
      <HStack w="100%" justify="flex-end" spacing={4}>
        {currentStep != 0 && (
          <Button
            variant="outline"
            onClick={() => setCurrentStep(currentStep - 1)}
            size="sm"
            isDisabled={isCreating}
          >
            Back
          </Button>
        )}
        <Button
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
