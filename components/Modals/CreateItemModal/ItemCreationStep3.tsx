// import {useToast} from '@/hooks/useToast';
import {
  Button,
  Divider,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Image,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { encodeAbiParameters } from 'viem';

import {
  CraftItemRequirement,
  CraftItemRequirementListInput,
} from '@/components/CraftableItemRequirementsListInput';
import { Switch } from '@/components/Switch';
import { useToast } from '@/hooks/useToast';

type Step3Props = {
  currentStep: number;
  setCurrentStep: (step: number) => void;

  craftableToggle: boolean;
  setCraftableToggle: React.Dispatch<React.SetStateAction<boolean>>;

  claimByRequirementsToggle: boolean;
  setClaimByRequirementsToggle: React.Dispatch<React.SetStateAction<boolean>>;

  requiredAssetsBytes: `0x${string}`;
  setRequiredAssetsBytes: React.Dispatch<React.SetStateAction<`0x${string}`>>;
};

export const ItemCreationStep3: React.FC<Step3Props> = ({
  currentStep,
  setCurrentStep,

  craftableToggle,
  setCraftableToggle,

  claimByRequirementsToggle,
  setClaimByRequirementsToggle,

  setRequiredAssetsBytes,
}) => {
  const [craftRequirementsList, setCraftRequirementsList] = useState<
    Array<CraftItemRequirement>
  >([]);

  const invalidCraftRequirements = useMemo(() => {
    return craftRequirementsList.length === 0;
  }, [craftRequirementsList]);

  const hasError = useMemo(() => {
    if (craftableToggle) {
      return invalidCraftRequirements;
    }
    return false;
  }, [craftableToggle, invalidCraftRequirements]);

  const [showError, setShowError] = useState(false);

  const { renderError } = useToast();

  const onNext = useCallback(() => {
    if (hasError) {
      setShowError(true);
      renderError('Please fix the errors in the form');
      return;
    }

    setCurrentStep(currentStep + 1);
  }, [currentStep, hasError, renderError, setCurrentStep]);

  useEffect(() => {
    if (craftableToggle) {
      const craftRequirements = craftRequirementsList.sort((a, b) =>
        Number(a.itemId - b.itemId),
      );

      const craftRequirementsBytes = encodeAbiParameters(
        [
          {
            components: [
              { name: 'itemId', type: 'uint256' },
              { name: 'amount', type: 'uint256' },
            ],
            name: 'CraftItem',
            type: 'tuple[]',
          },
        ],
        [craftRequirements],
      );

      setRequiredAssetsBytes(craftRequirementsBytes);
    } else if (claimByRequirementsToggle) {
      setRequiredAssetsBytes('0x');
    } else {
      setRequiredAssetsBytes('0x');
    }
  }, [
    craftableToggle,
    craftRequirementsList,
    setRequiredAssetsBytes,
    claimByRequirementsToggle,
  ]);

  return (
    <VStack spacing={8} w="100%">
      <FormControl>
        <Flex align="center">
          <FormLabel>Is this item craftable from other items?</FormLabel>
          <Tooltip label="By making this item craftable, you allow players to combine items to create this item.">
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
          isChecked={craftableToggle}
          onChange={() => {
            if (!craftableToggle) {
              setClaimByRequirementsToggle(craftableToggle);
            }
            setCraftableToggle(!craftableToggle);
            setCraftRequirementsList([]);
          }}
        />
      </FormControl>

      <FormControl>
        <Flex align="center">
          <FormLabel>Does this item have a claim requirement?</FormLabel>
          <Tooltip label="By implementing a claim requirement, you can regulate the eligibility criteria for players seeking to claim this item, such as possessing a specific class or attaining a certain amount of experience points.">
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
          isChecked={claimByRequirementsToggle}
          onChange={() => {
            if (!claimByRequirementsToggle) {
              setCraftableToggle(claimByRequirementsToggle);
              setCraftRequirementsList([]);
            }
            setClaimByRequirementsToggle(!claimByRequirementsToggle);
          }}
        />
      </FormControl>

      {craftableToggle || claimByRequirementsToggle ? (
        <>
          <Divider w="100%" />
          <Text fontSize="sm" textAlign="center">
            {craftableToggle
              ? 'Select the items that can be combined to craft this item.'
              : 'Define the requirements for players to claim this item.'}
          </Text>
          <FormControl isInvalid={showError && invalidCraftRequirements}>
            {craftableToggle && (
              <CraftItemRequirementListInput
                {...{
                  craftRequirementsList,
                  setCraftRequirementsList,
                }}
              />
            )}
            {showError && invalidCraftRequirements && (
              <FormHelperText color="red">
                Please add at least one item to the list.
              </FormHelperText>
            )}
          </FormControl>
        </>
      ) : null}

      <HStack w="100%" justify="flex-end" spacing={4}>
        {currentStep != 0 && (
          <Button
            variant="outline"
            onClick={() => setCurrentStep(currentStep - 1)}
            size="sm"
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
