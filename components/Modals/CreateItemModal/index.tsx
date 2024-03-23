import { Text } from '@chakra-ui/react';
import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { useCallback, useState } from 'react';
import { Address, encodeAbiParameters, getAddress, pad, parseAbi } from 'viem';
import { useWalletClient } from 'wagmi';

import { ClaimableAddress } from '@/components/ClaimableAddressListInput';
import { useGameActions } from '@/contexts/GameActionsContext';
import { useGame } from '@/contexts/GameContext';
import { ClaimableItemLeaf } from '@/hooks/useClaimableTree';
import { useUploadFile } from '@/hooks/useUploadFile';
import { EquippableTraitType } from '@/lib/traits';
import { Item } from '@/utils/types';

import { ActionModal } from '../ActionModal';
import { ItemCreationStep0 } from './ItemCreationStep0';
import { ItemCreationStep1 } from './ItemCreationStep1';
import { ItemCreationStep2 } from './ItemCreationStep2';
import { ItemCreationStep3 } from './ItemCreationStep3';
import { ItemCreationStep4 } from './ItemCreationStep4';

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
  const [itemSupply, setItemSupply] = useState<string>('');
  const [itemDistribution, setItemDistribution] = useState<string>('1');

  const [soulboundToggle, setSoulboundToggle] = useState<boolean>(false);
  const [claimableToggle, setClaimableToggle] = useState<boolean>(false);

  const [craftableToggle, setCraftableToggle] = useState<boolean>(false);
  const [claimByRequirementsToggle, setClaimByRequirementsToggle] =
    useState<boolean>(false);

  const [claimableAddressList, setClaimableAddressList] = useState<
    ClaimableAddress[]
  >([]);

  const [equippableType, setEquippableType] = useState<EquippableTraitType>(
    EquippableTraitType.EQUIPPED_WEARABLE,
  );

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
    setClaimableToggle(false);
    setClaimableAddressList([]);
    setItemEmblem(null);
    setItemLayer(null);
    setEquippableType(EquippableTraitType.EQUIPPED_WEARABLE);
    setRequiredAssetsBytes('0x');

    setIsCreating(false);
  }, [setItemEmblem, setItemLayer]);

  const onCreateItem = useCallback(async () => {
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
    equippableType,
    itemName,
    itemDescription,
    itemLayer,
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

  const itemToCreate: Item = {
    id: 'new_item',
    itemId: game?.items.length.toString() || '0',
    uri: '',
    soulbound: soulboundToggle,
    distribution: itemDistribution,
    supply: itemSupply,
    totalSupply: itemSupply,
    amount: '0',
    requirements: [],
    holders: [],
    equippers: [],
    merkleRoot: '',
    name: itemName,
    description: itemDescription,
    image: itemEmblem ? URL.createObjectURL(itemEmblem) : '',
    equippable_layer: itemLayer ? URL.createObjectURL(itemLayer) : '',
    attributes: [
      {
        trait_type: 'EQUIPPABLE TYPE',
        value: equippableType,
      },
    ],
  };

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
      <Text>Step {currentStep + 1} of 5</Text>
      {currentStep === 0 && (
        <ItemCreationStep0
          {...{
            currentStep,
            setCurrentStep,

            itemName,
            setItemName,

            itemDescription,
            setItemDescription,

            itemSupply,
            setItemSupply,

            itemDistribution,
            setItemDistribution,
          }}
        />
      )}

      {currentStep === 1 && (
        <ItemCreationStep1
          {...{
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
          }}
        />
      )}

      {currentStep === 2 && (
        <ItemCreationStep2
          {...{
            currentStep,
            setCurrentStep,

            claimableAddressList,
            setClaimableAddressList,

            soulboundToggle,
            setSoulboundToggle,

            claimableToggle,
            setClaimableToggle,

            itemSupply,
            itemDistribution,
          }}
        />
      )}

      {currentStep === 3 && (
        <ItemCreationStep3
          {...{
            currentStep,
            setCurrentStep,

            craftableToggle,
            setCraftableToggle,

            claimByRequirementsToggle,
            setClaimByRequirementsToggle,

            requiredAssetsBytes,
            setRequiredAssetsBytes,
          }}
        />
      )}

      {currentStep === 4 && (
        <ItemCreationStep4
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
