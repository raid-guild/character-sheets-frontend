import { Button, Flex, Image, Text, VStack } from '@chakra-ui/react';
import { useCallback, useMemo } from 'react';

import { Traits, TraitType } from './traits';

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

  const type = useMemo(() => {
    switch (index) {
      case 0:
        return TraitType.BACKGROUND;
      case 1:
        return TraitType.BODY;
      case 2:
        return TraitType.EYES;
      case 3:
        return TraitType.HAIR;
      case 4:
        return TraitType.CLOTHING;
      case 5:
        return TraitType.MOUTH;
      default:
        return '';
    }
  }, [index]);

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
    <VStack
      borderBottom="1px solid rgba(255,255,255,0.3)"
      mb={2}
      pb={4}
      w="100%"
    >
      <Flex align="center" justify="space-between" w="100%">
        <Button
          isDisabled={disablePrevious}
          onClick={onPreviousVariant}
          size="xs"
          variant="ghost"
        >
          <Image
            alt="caret-left"
            height="18px"
            src="/icons/caret-left.svg"
            width="18px"
          />
        </Button>
        <Text>
          {type}: {variant} {color.toUpperCase()}
        </Text>
        <Button
          isDisabled={disableNext}
          onClick={onNextVariant}
          size="xs"
          variant="ghost"
        >
          <Image
            alt="caret-right"
            height="18px"
            src="/icons/caret-right.svg"
            width="18px"
          />
        </Button>
      </Flex>
    </VStack>
  );
};
