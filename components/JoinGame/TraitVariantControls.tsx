import { Button, Flex, Text } from '@chakra-ui/react';
import { useCallback, useMemo } from 'react';

import { Traits } from './traits';

type TraitVariantControlsProps = {
  index: number;
  traits: Traits;
  setTraits: (traits: Traits) => void;
  traitsByType: string[];
};

export const TraitVariantControls: React.FC<TraitVariantControlsProps> = ({
  index,
  traits,
  setTraits,
  traitsByType,
}) => {
  const selectedTrait = traits[index];
  const [, variant, color] = selectedTrait.split('_');

  const onPreviousVariant = useCallback(() => {
    const traitsIndex = traits.findIndex(t => t === selectedTrait);
    const traitsByTypeIndex = traitsByType.findIndex(t => t === selectedTrait);
    const previous = traitsByType[traitsByTypeIndex - 1];

    if (!previous) {
      return;
    }

    const newTraits = [...traits] as Traits;
    newTraits[traitsIndex] = previous;
    setTraits(newTraits);
  }, [selectedTrait, setTraits, traits, traitsByType]);

  const onNextVariant = useCallback(() => {
    const traitsIndex = traits.findIndex(t => t === selectedTrait);
    const traitsByTypeIndex = traitsByType.findIndex(t => t === selectedTrait);
    const next = traitsByType[traitsByTypeIndex + 1];

    if (!next) {
      return;
    }

    const newTraits = [...traits] as Traits;
    newTraits[traitsIndex] = next;
    setTraits(newTraits);
  }, [selectedTrait, setTraits, traits, traitsByType]);

  const disablePrevious = useMemo(() => {
    const traitsByTypeIndex = traitsByType.findIndex(t => t === selectedTrait);
    return traitsByTypeIndex === 0;
  }, [selectedTrait, traitsByType]);

  const disableNext = useMemo(() => {
    const traitsByTypeIndex = traitsByType.findIndex(t => t === selectedTrait);
    return traitsByTypeIndex === traitsByType.length - 1;
  }, [selectedTrait, traitsByType]);

  return (
    <Flex justify="space-between" w="250px">
      <Button
        isDisabled={disablePrevious}
        onClick={onPreviousVariant}
        size="xs"
      >
        &#8592;
      </Button>
      <Text>
        {variant} {color.toUpperCase()}
      </Text>
      <Button isDisabled={disableNext} onClick={onNextVariant} size="xs">
        &#8594;
      </Button>
    </Flex>
  );
};
