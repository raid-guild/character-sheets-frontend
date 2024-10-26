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
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useMemo, useState } from 'react';

import { Dropdown } from '@/components/Dropdown';
import { MultiSourceImage } from '@/components/MultiSourceImage';
import { useCharacterLimitMessage } from '@/hooks/useCharacterLimitMessage';
import { useToast } from '@/hooks/useToast';
import { EquippableTraitType, getImageUri, ItemType } from '@/lib/traits';

import { DefaultItems } from './DefaultItems';

type Step0Props = {
  currentStep: number;
  setCurrentStep: (step: number) => void;

  itemName: string;
  setItemName: React.Dispatch<React.SetStateAction<string>>;

  itemDescription: string;
  setItemDescription: React.Dispatch<React.SetStateAction<string>>;

  itemEmblem: File | null;
  setItemEmblem: (file: File | null) => void;
  onRemoveEmblem: () => void;
  isUploadingEmblem: boolean;
  isUploadedEmblem: boolean;
  itemEmblemFileName: string;
  setItemEmblemFileName: (fileName: string) => void;

  itemLayer: File | null;
  setItemLayer: (file: File | null) => void;
  onRemoveLayer: () => void;
  isUploadingLayer: boolean;
  isUploadedLayer: boolean;
  itemLayerFileName: string;
  setItemLayerFileName: (fileName: string) => void;

  itemType: ItemType;
  setItemType: React.Dispatch<React.SetStateAction<ItemType>>;
  equippableType: EquippableTraitType;
  setEquippableType: React.Dispatch<React.SetStateAction<EquippableTraitType>>;
};

export const ItemCreationStep0: React.FC<Step0Props> = ({
  currentStep,
  setCurrentStep,

  itemName,
  setItemName,

  itemDescription,
  setItemDescription,

  itemEmblem,
  setItemEmblem,
  onRemoveEmblem,
  isUploadingEmblem,
  isUploadedEmblem,
  itemEmblemFileName,
  setItemEmblemFileName,

  itemLayer,
  setItemLayer,
  onRemoveLayer,
  isUploadingLayer,
  isUploadedLayer,
  itemLayerFileName,
  setItemLayerFileName,

  itemType,
  setItemType,
  equippableType,
  setEquippableType,
}) => {
  const characterLimitMessage = useCharacterLimitMessage({
    characterLimit: 200,
    currentCharacterCount: itemDescription.length,
  });

  const invalidItemDescription = useMemo(() => {
    return itemDescription.length > 200 && !!itemDescription;
  }, [itemDescription]);

  const [showError, setShowError] = useState<boolean>(false);

  const hasError = useMemo(() => {
    return (
      !itemDescription ||
      !itemName ||
      invalidItemDescription ||
      (!itemEmblem && !itemEmblemFileName)
    );
  }, [
    itemDescription,
    itemName,
    invalidItemDescription,
    itemEmblem,
    itemEmblemFileName,
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

  const isDisabled = isUploadingEmblem || isUploadingLayer;

  const defaultItemsControl = useDisclosure();

  return (
    <>
      <DefaultItems
        {...defaultItemsControl}
        {...{
          setItemName,
          setItemDescription,
          setItemEmblemFileName,
          setItemLayerFileName,
          setItemType,
          setEquippableType,
        }}
      />
      {!defaultItemsControl.isOpen && (
        <VStack spacing={8} w="100%">
          <FormControl isInvalid={showError && !itemName}>
            <FormLabel>Item Name</FormLabel>
            <Input
              onChange={e => setItemName(e.target.value)}
              type="text"
              value={itemName}
            />
            {showError && !itemName && (
              <FormHelperText color="red">
                An item name is required
              </FormHelperText>
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
          <FormControl isInvalid={showError && !itemEmblem}>
            <FormLabel>Item Emblem (Thumbnail)</FormLabel>
            {!itemEmblem && !itemEmblemFileName && (
              <Input
                accept=".png, .jpg, .jpeg, .svg"
                disabled={isDisabled}
                onChange={e => {
                  setItemEmblemFileName('');
                  setItemEmblem(e.target.files?.[0] ?? null);
                }}
                type="file"
                variant="file"
              />
            )}
            {(!!itemEmblem || !!itemEmblemFileName) && (
              <Flex align="center" gap={10} mt={4}>
                <MultiSourceImage
                  alt="item emblem"
                  objectFit="contain"
                  src={
                    itemEmblemFileName
                      ? getImageUri(itemEmblemFileName)
                      : itemEmblem
                        ? URL.createObjectURL(itemEmblem)
                        : ''
                  }
                  w="300px"
                />
                <Button
                  isDisabled={isUploadingEmblem || isUploadedEmblem}
                  isLoading={isUploadingEmblem}
                  loadingText="Uploading..."
                  mt={4}
                  onClick={
                    !isUploadedEmblem
                      ? () => {
                          setItemEmblemFileName('');
                          onRemoveEmblem();
                        }
                      : undefined
                  }
                  type="button"
                  variant="outline"
                >
                  {isUploadedEmblem ? 'Uploaded' : 'Remove'}
                </Button>
              </Flex>
            )}
            {showError && !itemEmblem && !itemEmblemFileName && (
              <FormHelperText color="red">
                An item emblem is required
              </FormHelperText>
            )}
          </FormControl>
          <FormControl>
            <Flex align="center">
              <FormLabel>Item Type</FormLabel>
              <Tooltip label="The item type determines where the item will render on the character card, if at all. BASIC is never rendered to the card, BADGE is rendered as a badge on the card, and EQUIPPABLE is baked into the actual character image.">
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
              options={Object.values(ItemType)}
              selectedOption={itemType}
              setSelectedOption={setItemType as (option: string) => void}
            />
          </FormControl>
          {itemType === ItemType.EQUIPPABLE && (
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
              {!itemLayer && !itemLayerFileName && (
                <Input
                  accept=".png, .jpg, .jpeg, .svg"
                  disabled={isDisabled}
                  onChange={e => setItemLayer(e.target.files?.[0] ?? null)}
                  type="file"
                  variant="file"
                />
              )}
              {(!!itemLayer || !!itemLayerFileName) && (
                <Flex align="center" gap={10} mt={4}>
                  <MultiSourceImage
                    alt="item layer"
                    objectFit="contain"
                    src={
                      itemLayerFileName
                        ? getImageUri(itemLayerFileName)
                        : itemLayer
                          ? URL.createObjectURL(itemLayer)
                          : ''
                    }
                    w="300px"
                  />
                  <Button
                    isDisabled={isUploadingLayer || isUploadedLayer}
                    isLoading={isUploadingLayer}
                    loadingText="Uploading..."
                    mt={4}
                    onClick={
                      !isUploadedLayer
                        ? () => {
                            setItemLayerFileName('');
                            onRemoveLayer();
                          }
                        : undefined
                    }
                    type="button"
                    variant="outline"
                  >
                    {isUploadedLayer ? 'Uploaded' : 'Remove'}
                  </Button>
                </Flex>
              )}
            </FormControl>
          )}
          {itemType === ItemType.EQUIPPABLE && (
            <FormControl>
              <Flex align="center">
                <FormLabel>Visually Equippable Type</FormLabel>
                <Tooltip label="The visually equippable type determines where the item will render when equipped by a character. EQUIPPABLE ITEM 1 renders in the right hand, EQUIPPED WEARABLE renders on the body, and EQUIPPABLE ITEM 2 renders in the left hand.">
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
                setSelectedOption={
                  setEquippableType as (option: string) => void
                }
              />
            </FormControl>
          )}
          <HStack w="100%" justify="space-between" spacing={4}>
            <Button variant="outline" onClick={defaultItemsControl.onOpen}>
              Choose from defaults
            </Button>
            <Button variant="solid" onClick={onNext}>
              Next
            </Button>
          </HStack>
        </VStack>
      )}
    </>
  );
};
