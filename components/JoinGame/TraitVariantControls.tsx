import { Box, Button, Flex, Image, Text, VStack } from '@chakra-ui/react';
import { capitalize } from 'lodash';
import { useCallback, useMemo, useState } from 'react';

import { BaseTraitType, EquippableTraitType, TraitsArray } from './traits';

type TraitVariantControlsProps = {
  index: number;
  traits: TraitsArray;
  setTraits: (traits: TraitsArray) => void;
  traitsByType: { [key: string]: string[] };
};

export const TraitVariantControls: React.FC<TraitVariantControlsProps> = ({
  index,
  traits,
  setTraits,
  traitsByType,
}) => {
  const selectedTrait = traits[index];
  const [, variant, , hex] = selectedTrait.split('_');

  const [selectedVariant, setSelectedVariant] = useState(variant);
  const [selectedHex, setSelectedHex] = useState(hex);

  const type = useMemo(() => {
    switch (index) {
      case 0:
        return BaseTraitType.BACKGROUND;
      case 1:
        return BaseTraitType.BODY;
      case 2:
        return BaseTraitType.EYES;
      case 3:
        return BaseTraitType.HAIR;
      case 4:
        return EquippableTraitType.EQUIPPED_ITEM_1;
      case 5:
        return BaseTraitType.CLOTHING;
      case 6:
        return BaseTraitType.MOUTH;
      default:
        return '';
    }
  }, [index]);

  const onPreviousVariant = useCallback(() => {
    const variants = Object.keys(traitsByType).map(v => capitalize(v));
    const variantIndex = variants.findIndex(v => v === selectedVariant);
    const previewVariant = variants[variantIndex - 1];

    if (!previewVariant) {
      return;
    }

    setSelectedVariant(previewVariant);
    const newTraits = [...traits] as TraitsArray;
    const newTrait = traitsByType[previewVariant.toLowerCase()][0];
    newTraits[index] = newTrait;
    setTraits(newTraits);
  }, [index, selectedVariant, setTraits, traits, traitsByType]);

  const onNextVariant = useCallback(() => {
    const variants = Object.keys(traitsByType).map(v => capitalize(v));
    const variantIndex = variants.findIndex(v => v === selectedVariant);
    const nextVariant = variants[variantIndex + 1];

    if (!nextVariant) {
      return;
    }

    setSelectedVariant(nextVariant);
    const newTraits = [...traits] as TraitsArray;
    const newTrait = traitsByType[nextVariant.toLowerCase()][0];
    newTraits[index] = newTrait;
    setTraits(newTraits);
  }, [index, selectedVariant, setTraits, traits, traitsByType]);

  const disablePrevious = useMemo(() => {
    const variants = Object.keys(traitsByType).map(v => capitalize(v));
    const variantIndex = variants.findIndex(v => v === selectedVariant);
    return variantIndex === 0;
  }, [selectedVariant, traitsByType]);

  const disableNext = useMemo(() => {
    const variants = Object.keys(traitsByType).map(v => capitalize(v));
    const variantIndex = variants.findIndex(v => v === selectedVariant);
    return variantIndex === variants.length - 1;
  }, [selectedVariant, traitsByType]);

  const hexSelections = useMemo(() => {
    const variantSelections = traitsByType[selectedVariant.toLowerCase()];
    if (!variantSelections) {
      return [];
    }
    return variantSelections.map(v => v.split('_')[3]);
  }, [selectedVariant, traitsByType]);

  const onSelectHex = useCallback(
    (newHex: string) => {
      const newTraits = [...traits] as TraitsArray;
      const variantSelections = traitsByType[selectedVariant.toLowerCase()];
      const newTrait = variantSelections.find(
        v => v.split('_')[3] === newHex,
      ) as string;
      if (!newTrait) {
        return;
      }
      newTraits[index] = newTrait;
      setSelectedHex(newHex);
      setTraits(newTraits);
    },
    [index, selectedVariant, setSelectedHex, setTraits, traits, traitsByType],
  );

  const formattedVariantName = useMemo(() => {
    const possibleVariantNumber = selectedVariant.slice(-1);
    const isNumber = !isNaN(Number(possibleVariantNumber));
    if (!isNumber) {
      return selectedVariant;
    }
    return selectedVariant.slice(0, -1) + ' ' + possibleVariantNumber;
  }, [selectedVariant]);

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
          <Text as="span" fontSize="xs">
            {type}:
          </Text>{' '}
          {formattedVariantName}
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
      <Flex gap={2}>
        {hexSelections.map(hex => (
          <Flex
            align="center"
            background="transparent"
            border={
              selectedHex === hex && !!selectedHex
                ? '1px solid #fff'
                : '1px solid transparent'
            }
            borderRadius="50%"
            cursor={!selectedHex ? 'default' : 'pointer'}
            h="25px"
            justify="center"
            key={`color-${hex}`}
            onClick={() => onSelectHex(hex)}
            p={1}
            w="25px"
          >
            <Box
              bg={hex ? `#${hex}` : 'transparent'}
              borderRadius="50%"
              h="100%"
              w="100%"
            />
          </Flex>
        ))}
      </Flex>
    </VStack>
  );
};
