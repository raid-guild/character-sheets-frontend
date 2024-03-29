import {
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Image,
  Input,
  SimpleGrid,
  Text,
  Textarea,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { useCallback, useMemo, useState } from 'react';
import {
  Address,
  encodeAbiParameters,
  getAddress,
  isAddress,
  maxUint256,
  pad,
  parseAbi,
} from 'viem';
import { useWalletClient } from 'wagmi';

import { Dropdown } from '@/components/Dropdown';
import { Switch } from '@/components/Switch';
import { useGameActions } from '@/contexts/GameActionsContext';
import { useGame } from '@/contexts/GameContext';
import { useCharacterLimitMessage } from '@/hooks/useCharacterLimitMessage';
import { ClaimableItemLeaf } from '@/hooks/useClaimableTree';
import { useToast } from '@/hooks/useToast';
import { useUploadFile } from '@/hooks/useUploadFile';
import { EquippableTraitType } from '@/lib/traits';

import {
  ClaimableAddress,
  ClaimableAddressListInput,
} from '../ClaimableAddressListInput';
import { ActionModal } from './ActionModal';

export const CreateItemModal: React.FC = () => {
  const { createItemModal } = useGameActions();
  const { data: walletClient } = useWalletClient();
  const { game, reload: reloadGame } = useGame();
  const { renderError } = useToast();

  const {
    file: itemEmblem,
    setFile: setItemEmblem,
    onRemove: onRemoveEmblem,
    onUpload: onUploadEmblem,
    isUploading: isUploadingEmblem,
    isUploaded: isUploadedEmblem,
  } = useUploadFile({ fileName: 'itemEmblem' });

  const {
    file: itemLayer,
    setFile: setItemLayer,
    onRemove: onRemoveLayer,
    onUpload: onUploadLayer,
    isUploading: isUploadingLayer,
    isUploaded: isUploadedLayer,
  } = useUploadFile({ fileName: 'itemLayer' });

  const [itemName, setItemName] = useState<string>('');
  const [itemDescription, setItemDescription] = useState<string>('');
  const characterLimitMessage = useCharacterLimitMessage({
    characterLimit: 200,
    currentCharacterCount: itemDescription.length,
  });
  const [itemSupply, setItemSupply] = useState<string>('');
  const [itemDistribution, setItemDistribution] = useState<string>('1');
  const [classRequirementsToggle, setClassRequirementsToggle] =
    useState<boolean>(false);
  const [classRequirements, setClassRequirements] = useState<string[]>([]);
  const [xpRequirementToggle, setXpRequirementToggle] =
    useState<boolean>(false);
  const [xpRequiredAmount, setXpRequiredAmount] = useState<string>('');
  const [soulboundToggle, setSoulboundToggle] = useState<boolean>(false);
  const [claimableToggle, setClaimableToggle] = useState<boolean>(false);

  const [claimableAddressList, setClaimableAddressList] = useState<
    ClaimableAddress[]
  >([]);

  const [equippableType, setEquippableType] = useState<EquippableTraitType>(
    EquippableTraitType.EQUIPPED_WEARABLE,
  );

  const [showError, setShowError] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);

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

  const invalidXpRequiredAmount = useMemo(() => {
    return (
      xpRequirementToggle &&
      (!xpRequiredAmount ||
        BigInt(xpRequiredAmount).toString() === 'NaN' ||
        BigInt(xpRequiredAmount) <= BigInt(0) ||
        BigInt(xpRequiredAmount) > maxUint256)
    );
  }, [xpRequiredAmount, xpRequirementToggle]);

  const invalidClaimableAddressList = useMemo(() => {
    const totalAmount = claimableAddressList.reduce(
      (acc, { amount }) => acc + BigInt(amount),
      BigInt(0),
    );

    if (totalAmount > BigInt(itemSupply)) return true;

    return claimableAddressList.some(
      ({ address, amount }) =>
        !isAddress(address) ||
        BigInt(amount) <= BigInt(0) ||
        BigInt(amount) > BigInt(itemDistribution) ||
        BigInt(amount).toString() === 'NaN',
    );
  }, [claimableAddressList, itemSupply, itemDistribution]);

  const hasError = useMemo(() => {
    return (
      !itemDescription ||
      !itemEmblem ||
      !itemName ||
      invalidItemDescription ||
      invalidItemSupply ||
      invalidItemDistribution ||
      invalidXpRequiredAmount ||
      invalidClaimableAddressList
    );
  }, [
    itemDescription,
    itemEmblem,
    itemName,
    invalidClaimableAddressList,
    invalidItemDescription,
    invalidItemSupply,
    invalidItemDistribution,
    invalidXpRequiredAmount,
  ]);

  const resetData = useCallback(() => {
    setItemName('');
    setItemDescription('');
    setItemSupply('');
    setItemDistribution('1');
    setClassRequirementsToggle(false);
    setClassRequirements([]);
    setXpRequirementToggle(false);
    setXpRequiredAmount('');
    setSoulboundToggle(false);
    setClaimableToggle(false);
    setClaimableAddressList([]);
    setItemEmblem(null);
    setItemLayer(null);
    setEquippableType(EquippableTraitType.EQUIPPED_WEARABLE);

    setShowError(false);

    setIsCreating(false);
  }, [setItemEmblem, setItemLayer]);

  const onCreateItem = useCallback(async () => {
    if (hasError) {
      setShowError(true);
      renderError('Please fix the errors in the form');
      return null;
    }

    if (!walletClient) throw new Error('Wallet client is not connected');
    if (!(game && game.itemsAddress))
      throw new Error(
        `Missing item factory address for the ${walletClient.chain.name} network`,
      );

    const emblemCID = await onUploadEmblem();
    if (!emblemCID)
      throw new Error('Something went wrong uploading your item emblem');

    let layerCID = emblemCID;
    if (itemLayer) {
      layerCID = await onUploadLayer();
      if (!layerCID)
        throw new Error('Something went wrong uploading your item thumbnail');
    }

    const itemMetadata = {
      name: itemName,
      description: itemDescription,
      image: `ipfs://${emblemCID}`,
      equippable_layer: `ipfs://${layerCID}`,
      attributes: [
        {
          trait_type: 'EQUIPPABLE TYPE',
          value: equippableType,
        },
      ],
    };

    setIsCreating(true);

    const res = await fetch('/api/uploadMetadata?name=itemMetadata.json', {
      method: 'POST',
      body: JSON.stringify(itemMetadata),
    });
    if (!res.ok)
      throw new Error('Something went wrong uploading your item metadata');

    const { cid: itemMetadataCid } = await res.json();
    if (!itemMetadataCid)
      throw new Error('Something went wrong uploading your item metadata');

    let claimable = pad('0x01');

    if (claimableToggle) {
      if (claimableAddressList.length === 0) {
        claimable = pad('0x00');
      } else {
        const itemId = BigInt(game.items.length);
        const leaves: ClaimableItemLeaf[] = claimableAddressList.map(
          ({ address, amount }) => {
            return [
              BigInt(itemId),
              getAddress(address),
              BigInt(0),
              BigInt(amount),
            ];
          },
        );

        const tree = StandardMerkleTree.of(leaves, [
          'uint256',
          'address',
          'uint256',
          'uint256',
        ]);

        claimable = tree.root as `0x${string}`;

        const jsonTree = JSON.stringify(tree.dump());
        const data = {
          itemId: game.items.length,
          gameAddress: game.id,
          tree: jsonTree,
          chainId: game.chainId,
        };

        const signature = await walletClient.signMessage({
          message: '/api/setTree',
          account: walletClient.account?.address as Address,
        });

        const res = await fetch('/api/setTree', {
          headers: {
            'x-account-address': walletClient.account?.address as Address,
            'x-account-signature': signature,
            'x-account-chain-id': walletClient.chain.id.toString(),
          },
          method: 'POST',
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          console.error('Something went wrong uploading your claimable tree.');
          throw new Error('Something went wrong uploading your claimable tree');
        }
      }
    }

    const requiredClassIds = classRequirements.map(cr => BigInt(cr));
    const requiredAssetCategories = [
      ...(xpRequirementToggle ? [0] : []),
      ...requiredClassIds.map(() => 2),
    ];
    const requiredAssetAddresses = [
      ...(xpRequirementToggle ? [game.experienceAddress as Address] : []),
      ...requiredClassIds.map(() => game.classesAddress as Address),
    ];

    const requiredAssetIds = [
      ...(xpRequirementToggle ? [BigInt(0)] : []),
      ...requiredClassIds,
    ];

    // TODO: Make class amounts dynamic when class levels are added
    const requiredAssetAmounts = [
      ...(xpRequirementToggle ? [BigInt(xpRequiredAmount)] : []),
      ...requiredClassIds.map(() => BigInt(1)),
    ];

    // TODO: item and XP requirements still need added
    const requiredAssetsBytes = encodeAbiParameters(
      [
        {
          name: 'requiredAssetCategories',
          type: 'uint8[]',
        },
        {
          name: 'requiredAssetAddresses',
          type: 'address[]',
        },
        {
          name: 'requiredAssetIds',
          type: 'uint256[]',
        },
        {
          name: 'requiredAssetAmounts',
          type: 'uint256[]',
        },
      ],
      [
        [...requiredAssetCategories],
        [...requiredAssetAddresses],
        [...requiredAssetIds],
        [...requiredAssetAmounts],
      ],
    );

    const encodedItemCreationData = encodeAbiParameters(
      [
        {
          name: 'craftable',
          type: 'bool',
        },
        {
          name: 'soulbound',
          type: 'bool',
        },
        {
          name: 'claimable',
          type: 'bytes32',
        },
        {
          name: 'distribution',
          type: 'uint256',
        },
        {
          name: 'supply',
          type: 'uint256',
        },
        {
          name: 'cid',
          type: 'string',
        },
        {
          name: 'requiredAssets',
          type: 'bytes',
        },
      ],
      [
        false,
        soulboundToggle,
        claimable,
        BigInt(itemDistribution),
        BigInt(itemSupply),
        itemMetadataCid,
        requiredAssetsBytes,
      ],
    );

    try {
      const transactionhash = await walletClient.writeContract({
        chain: walletClient.chain,
        account: walletClient.account?.address as Address,
        address: game.itemsAddress as Address,
        abi: parseAbi([
          'function createItemType(bytes calldata itemData) external returns (uint256)',
        ]),
        functionName: 'createItemType',
        args: [encodedItemCreationData],
      });
      return transactionhash;
    } catch (e) {
      throw e;
    } finally {
      setIsCreating(false);
    }
  }, [
    claimableAddressList,
    claimableToggle,
    classRequirements,
    equippableType,
    itemName,
    itemDescription,
    itemLayer,
    itemSupply,
    itemDistribution,
    game,
    hasError,
    onUploadEmblem,
    onUploadLayer,
    renderError,
    soulboundToggle,
    walletClient,
    xpRequiredAmount,
    xpRequirementToggle,
  ]);

  const isLoading = isCreating;
  const isDisabled = isLoading || isUploadingEmblem || isUploadingLayer;

  return (
    <ActionModal
      {...{
        isOpen: createItemModal?.isOpen,
        onClose: createItemModal?.onClose,
        header: 'Create an Item',
        loadingText: `Your item is being created...`,
        successText: 'Your item was successfully created!',
        errorText: 'There was an error creating your item.',
        resetData,
        onAction: onCreateItem,
        onComplete: reloadGame,
      }}
    >
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
            <FormLabel>Restrict to characters with specific classes?</FormLabel>
            <Tooltip label="Only characters that hold the configured list of classes will be able to claim this item.">
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
            isChecked={classRequirementsToggle}
            onChange={() =>
              setClassRequirementsToggle(!classRequirementsToggle)
            }
          />
        </FormControl>

        {classRequirementsToggle && (
          <SimpleGrid columns={{ base: 2, sm: 4 }} spacing={3} w="100%">
            {game?.classes.map(c => (
              <Button
                h="200px"
                key={c.id}
                onClick={() => {
                  if (classRequirements.includes(c.classId)) {
                    setClassRequirements(
                      classRequirements.filter(cr => cr !== c.classId),
                    );
                  } else {
                    setClassRequirements([...classRequirements, c.classId]);
                  }
                }}
                variant="unstyled"
                width="100%"
              >
                <VStack
                  background={
                    classRequirements.includes(c.classId) ? 'black' : 'white'
                  }
                  border="3px solid black"
                  borderBottom="5px solid black"
                  borderRight="5px solid black"
                  color={
                    classRequirements.includes(c.classId) ? 'white' : 'black'
                  }
                  cursor="pointer"
                  fontWeight={600}
                  h="100%"
                  justify="space-between"
                  px={5}
                  py={3}
                >
                  <Image
                    alt={`${c.name} image`}
                    h="70%"
                    objectFit="contain"
                    src={c.image}
                    w="100%"
                  />
                  <Text textAlign="center" fontSize="14px">
                    {c.name}
                  </Text>
                </VStack>
              </Button>
            ))}
          </SimpleGrid>
        )}

        <FormControl
          isInvalid={showError && xpRequirementToggle && !xpRequiredAmount}
        >
          <FormLabel>Require a certain amount of XP?</FormLabel>
          <Switch
            isChecked={xpRequirementToggle}
            onChange={() => setXpRequirementToggle(!xpRequirementToggle)}
          />
          {xpRequirementToggle && (
            <Input
              mt={2}
              onChange={e => setXpRequiredAmount(e.target.value)}
              type="number"
              value={xpRequiredAmount}
            />
          )}
          {showError && xpRequirementToggle && !xpRequiredAmount && (
            <FormHelperText color="red">
              An XP amount is required
            </FormHelperText>
          )}
          {showError && invalidXpRequiredAmount && (
            <FormHelperText color="red">
              XP amount must be a number greater than 0
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
            <FormLabel>Allow players to claim?</FormLabel>
            <Tooltip label="If you don't allow players to claim, then items can only be given by the GameMaster.">
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
            isChecked={claimableToggle}
            onChange={() => setClaimableToggle(!claimableToggle)}
          />
        </FormControl>
        {claimableToggle && (
          <ClaimableAddressListInput
            claimableAddressList={claimableAddressList}
            itemSupply={itemSupply}
            itemDistribution={itemDistribution}
            setClaimableAddressList={setClaimableAddressList}
          />
        )}
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
        <Button
          alignSelf="flex-end"
          isDisabled={isDisabled}
          isLoading={isLoading}
          loadingText="Creating..."
          type="submit"
          variant="solid"
        >
          Create
        </Button>
      </VStack>
    </ActionModal>
  );
};
