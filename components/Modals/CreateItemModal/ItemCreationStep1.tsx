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

import { Dropdown } from '@/components/Dropdown';
import { useToast } from '@/hooks/useToast';
import { EquippableTraitType } from '@/lib/traits';

type Step1Props = {
  currentStep: number;
  setCurrentStep: (step: number) => void;

  itemEmblem: File | null;
  setItemEmblem: (file: File | null) => void;
  onRemoveEmblem: () => void;
  isUploadingEmblem: boolean;
  isUploadedEmblem: boolean;

  itemLayer: File | null;
  setItemLayer: (file: File | null) => void;
  onRemoveLayer: () => void;
  isUploadingLayer: boolean;
  isUploadedLayer: boolean;

  equippableType: EquippableTraitType;
  setEquippableType: React.Dispatch<React.SetStateAction<EquippableTraitType>>;
};

export const ItemCreationStep1: React.FC<Step1Props> = ({
  currentStep,
  setCurrentStep,

  itemEmblem,
  setItemEmblem,
  onRemoveEmblem,
  isUploadingEmblem,
  isUploadedEmblem,

  itemLayer,
  setItemLayer,
  onRemoveLayer,
  isUploadingLayer,
  isUploadedLayer,

  equippableType,
  setEquippableType,
}) => {
  const hasError = useMemo(() => {
    return !itemEmblem;
  }, [itemEmblem]);

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

  const isDisabled = isUploadingEmblem || isUploadingLayer;

  return (
    <VStack spacing={8} w="100%">
      <FormControl isInvalid={showError && !itemEmblem}>
        <FormLabel>Item Emblem (Thumbnail)</FormLabel>
        {!itemEmblem && (
          <Input
            accept=".png, .jpg, .jpeg, .svg"
            disabled={isDisabled}
            onChange={e => setItemEmblem(e.target.files?.[0] ?? null)}
            type="file"
            variant="file"
          />
        )}
        {itemEmblem && (
          <Flex align="center" gap={10} mt={4}>
            <Image
              alt="item emblem"
              objectFit="contain"
              src={URL.createObjectURL(itemEmblem)}
              w="300px"
            />
            <Button
              isDisabled={isUploadingEmblem || isUploadedEmblem}
              isLoading={isUploadingEmblem}
              loadingText="Uploading..."
              mt={4}
              onClick={!isUploadedEmblem ? onRemoveEmblem : undefined}
              type="button"
              variant="outline"
            >
              {isUploadedEmblem ? 'Uploaded' : 'Remove'}
            </Button>
          </Flex>
        )}
        {showError && !itemEmblem && (
          <FormHelperText color="red">
            An item emblem is required
          </FormHelperText>
        )}
      </FormControl>
      <FormControl>
        <Flex align="center">
          <FormLabel>Equippable Item Layer</FormLabel>
          <Tooltip
            label="The equippable item layer is combined with a character's
            current image when they equip the item. If you do not upload an
            equippable layer, the item emblem will be used instead."
          >
            <Image
              alt="down arrow"
              height="14px"
              mb={2}
              src="/icons/question-mark.svg"
              width="14px"
            />
          </Tooltip>
        </Flex>
        {!itemLayer && (
          <Input
            accept=".png, .jpg, .jpeg, .svg"
            disabled={isDisabled}
            onChange={e => setItemLayer(e.target.files?.[0] ?? null)}
            type="file"
            variant="file"
          />
        )}
        {itemLayer && (
          <Flex align="center" gap={10} mt={4}>
            <Image
              alt="item layer"
              objectFit="contain"
              src={URL.createObjectURL(itemLayer)}
              w="300px"
            />
            <Button
              isDisabled={isUploadingLayer || isUploadedLayer}
              isLoading={isUploadingLayer}
              loadingText="Uploading..."
              mt={4}
              onClick={!isUploadedLayer ? onRemoveLayer : undefined}
              type="button"
              variant="outline"
            >
              {isUploadedLayer ? 'Uploaded' : 'Remove'}
            </Button>
          </Flex>
        )}
      </FormControl>
      <FormControl>
        <Flex align="center">
          <FormLabel>Item Type</FormLabel>
          <Tooltip label="The type determines where the item will render when equipped by a character.">
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
          options={Object.values(EquippableTraitType)}
          selectedOption={equippableType}
          setSelectedOption={setEquippableType as (option: string) => void}
        />
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
