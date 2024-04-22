import { Text } from '@chakra-ui/react';
import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { useCallback, useMemo, useState } from 'react';
import { Address, encodeAbiParameters, getAddress, pad, parseAbi } from 'viem';
import { useWalletClient } from 'wagmi';

import { WhitelistAddress } from '@/components/WhitelistAddressListInput';
import { useGameActions } from '@/contexts/GameActionsContext';
import { useGame } from '@/contexts/GameContext';
import { useUploadFile } from '@/hooks/useUploadFile';
import { WhitelistItemLeaf } from '@/hooks/useWhitelistTree';
import {
  EquippableTraitType,
  getImageIpfsUri,
  getImageUrl,
  ItemType,
} from '@/lib/traits';
import {
  CraftRequirement,
  Item,
  Metadata,
  RequirementNode,
} from '@/utils/types';

import { ActionModal } from '../ActionModal';
import { ItemCreationStep0 } from './ItemCreationStep0';
import { ItemCreationStep1 } from './ItemCreationStep1';
import { ItemCreationStep2 } from './ItemCreationStep2';
import { ItemCreationStep3 } from './ItemCreationStep3';

export const CreateItemModal: React.FC = () => {
  const { createItemModal } = useGameActions();
  const { data: walletClient } = useWalletClient();
  const { game, reload: reloadGame } = useGame();

  const {
    file: itemEmblem,
    setFile: setItemEmblem,
    onRemove: onRemoveEmblem,
    onUpload: onUploadEmblem,
    isUploading: isUploadingEmblem,
    isUploaded: isUploadedEmblem,
  } = useUploadFile({ fileName: 'itemEmblem' });

  const [itemEmblemFileName, setItemEmblemFileName] = useState<string>('');

  const {
    file: itemLayer,
    setFile: setItemLayer,
    onRemove: onRemoveLayer,
    onUpload: onUploadLayer,
    isUploading: isUploadingLayer,
    isUploaded: isUploadedLayer,
  } = useUploadFile({ fileName: 'itemLayer' });

  const [itemLayerFileName, setItemLayerFileName] = useState<string>('');

  const [itemName, setItemName] = useState<string>('');
  const [itemDescription, setItemDescription] = useState<string>('');
  const [itemSupply, setItemSupply] = useState<string>('');
  const [itemDistribution, setItemDistribution] = useState<string>('1');

  const [soulboundToggle, setSoulboundToggle] = useState<boolean>(false);
  const [whitelistToggle, setWhitelistToggle] = useState<boolean>(true);

  const [craftableToggle, setCraftableToggle] = useState<boolean>(false);
  const [claimByRequirementsToggle, setClaimByRequirementsToggle] =
    useState<boolean>(false);

  const [whitelistAddressList, setWhitelistAddressList] = useState<
    WhitelistAddress[]
  >([]);

  const [itemType, setItemType] = useState<ItemType>(ItemType.BASIC);
  const [equippableType, setEquippableType] = useState<EquippableTraitType>(
    EquippableTraitType.EQUIPPED_WEARABLE,
  );

  const [craftRequirementsList, setCraftRequirementsList] = useState<
    Array<CraftRequirement>
  >([]);

  const [requirementNode, setRequirementNode] =
    useState<RequirementNode | null>(null);

  const [requiredAssetsBytes, setRequiredAssetsBytes] =
    useState<`0x${string}`>('0x');

  const [isCreating, setIsCreating] = useState<boolean>(false);

  const [currentStep, setCurrentStep] = useState<number>(0);

  const resetData = useCallback(() => {
    setCurrentStep(0);
    setItemName('');
    setItemDescription('');
    setItemSupply('');
    setItemDistribution('1');
    setSoulboundToggle(false);
    setWhitelistToggle(false);
    setWhitelistAddressList([]);
    setItemEmblem(null);
    setItemEmblemFileName('');
    setItemLayer(null);
    setItemLayerFileName('');
    setItemType(ItemType.BASIC);
    setEquippableType(EquippableTraitType.EQUIPPED_WEARABLE);
    setCraftableToggle(false);
    setCraftRequirementsList([]);
    setClaimByRequirementsToggle(false);
    setRequirementNode(null);
    setRequiredAssetsBytes('0x');

    setIsCreating(false);
  }, [setItemEmblem, setItemLayer]);

  const onCreateItem = useCallback(async () => {
    if (!walletClient) throw new Error('Wallet client is not connected');
    if (!(game && game.itemsAddress))
      throw new Error(
        `Missing item factory address for the ${walletClient.chain.name} network`,
      );

    let emblemIpfsUri = getImageIpfsUri(itemEmblemFileName);
    if (!emblemIpfsUri) emblemIpfsUri = `ipfs://${await onUploadEmblem()}`;

    if (!emblemIpfsUri)
      throw new Error('Something went wrong uploading your item thumbnail');

    let layerIpfsUri = '';
    if (itemType === ItemType.EQUIPPABLE) {
      layerIpfsUri = getImageIpfsUri(itemLayerFileName);
      if (!layerIpfsUri) layerIpfsUri = emblemIpfsUri;
      if (!!itemLayer) layerIpfsUri = `ipfs://${await onUploadLayer()}`;

      if (!layerIpfsUri)
        throw new Error('Something went wrong uploading your item layer');
    }

    const attributes: {
      trait_type: string;
      value: ItemType | EquippableTraitType;
    }[] = [
      {
        trait_type: 'ITEM TYPE',
        value: itemType,
      },
    ];

    if (itemType === ItemType.EQUIPPABLE) {
      attributes.push({
        trait_type: 'EQUIPPABLE TYPE',
        value: equippableType,
      });
    }

    const itemMetadata: Metadata = {
      name: itemName,
      description: itemDescription,
      image: emblemIpfsUri,
      equippable_layer: itemType === ItemType.EQUIPPABLE ? layerIpfsUri : null,
      attributes,
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

    let whitelist = pad('0x01');

    if (whitelistToggle) {
      if (whitelistAddressList.length === 0) {
        whitelist = pad('0x00');
      } else {
        const itemId = BigInt(game.items.length + 1);
        const leaves: WhitelistItemLeaf[] = whitelistAddressList.map(
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

        whitelist = tree.root as `0x${string}`;

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
          console.error('Something went wrong uploading your whitelist tree.');
          throw new Error('Something went wrong uploading your whitelist tree');
        }
      }
    }

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
        craftableToggle,
        soulboundToggle,
        whitelist,
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
    whitelistAddressList,
    whitelistToggle,
    itemType,
    equippableType,
    itemName,
    itemDescription,
    itemEmblemFileName,
    itemLayer,
    itemLayerFileName,
    itemSupply,
    itemDistribution,
    game,
    onUploadEmblem,
    onUploadLayer,
    soulboundToggle,
    walletClient,
    requiredAssetsBytes,
    craftableToggle,
  ]);

  const itemToCreate: Item = useMemo(() => {
    const _itemToCreate = {
      id: 'new_item',
      itemId: (Number(game?.items.length) + 1).toString() || '0',
      uri: '',
      craftable: craftableToggle,
      soulbound: soulboundToggle,
      distribution: itemDistribution,
      supply: itemSupply,
      totalSupply: itemSupply,
      amount: '0',
      craftRequirements: [],
      claimRequirements: null,
      holders: [],
      equippers: [],
      merkleRoot: '',
      name: itemName,
      description: itemDescription,
      image: itemEmblemFileName
        ? getImageUrl(itemEmblemFileName)
        : itemEmblem
          ? URL.createObjectURL(itemEmblem)
          : '',
      equippable_layer: '',
      attributes: [
        {
          trait_type: 'ITEM TYPE',
          value: itemType,
        },
      ] as { trait_type: string; value: ItemType | EquippableTraitType }[],
    };

    if (itemType === ItemType.EQUIPPABLE) {
      _itemToCreate.attributes.push({
        trait_type: 'EQUIPPABLE TYPE',
        value: equippableType,
      });
    }

    return _itemToCreate;
  }, [
    game,
    itemName,
    itemDescription,
    itemEmblem,
    itemEmblemFileName,
    itemType,
    equippableType,
    itemSupply,
    itemDistribution,
    craftableToggle,
    soulboundToggle,
  ]);

  const isLoading = isUploadingEmblem || isUploadingLayer || isCreating;

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
      <Text>Step {currentStep + 1} of 4</Text>
      {currentStep === 0 && (
        <ItemCreationStep0
          {...{
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
          }}
        />
      )}

      {currentStep === 1 && (
        <ItemCreationStep1
          {...{
            currentStep,
            setCurrentStep,

            itemSupply,
            setItemSupply,

            itemDistribution,
            setItemDistribution,

            whitelistAddressList,
            setWhitelistAddressList,

            soulboundToggle,
            setSoulboundToggle,

            whitelistToggle,
            setWhitelistToggle,
          }}
        />
      )}

      {currentStep === 2 && (
        <ItemCreationStep2
          {...{
            currentStep,
            setCurrentStep,

            craftableToggle,
            setCraftableToggle,

            claimByRequirementsToggle,
            setClaimByRequirementsToggle,

            requiredAssetsBytes,
            setRequiredAssetsBytes,

            craftRequirementsList,
            setCraftRequirementsList,

            requirementNode,
            setRequirementNode,
          }}
        />
      )}

      {currentStep === 3 && (
        <ItemCreationStep3
          {...{
            currentStep,
            setCurrentStep,

            itemToCreate,

            isCreating: isLoading,
          }}
        />
      )}
    </ActionModal>
  );
};
