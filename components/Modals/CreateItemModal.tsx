import {
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Text,
  Textarea,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  encodeAbiParameters,
  getAddress,
  isAddress,
  maxUint256,
  pad,
  parseAbi,
} from 'viem';
import { Address, usePublicClient, useWalletClient } from 'wagmi';

import { Switch } from '@/components/Switch';
import { TransactionPending } from '@/components/TransactionPending';
import { useGameActions } from '@/contexts/GameActionsContext';
import { useGame } from '@/contexts/GameContext';
import { waitUntilBlock } from '@/graphql/health';
import { ClaimableItemLeaf } from '@/hooks/useClaimableTree';
import { useToast } from '@/hooks/useToast';
import { useUploadFile } from '@/hooks/useUploadFile';

import {
  ClaimableAddress,
  ClaimableAddressListInput,
} from '../ClaimableAddressListInput';

export const CreateItemModal: React.FC = () => {
  const { createItemModal } = useGameActions();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { renderError } = useToast();

  const { game, reload: reloadGame } = useGame();

  const {
    file: itemEmblem,
    setFile: setItemEmblem,
    onRemove,
    onUpload,
    isUploading,
    isUploaded,
  } = useUploadFile({ fileName: 'itemEmblem' });

  const [itemName, setItemName] = useState<string>('');
  const [itemDescription, setItemDescription] = useState<string>('');
  const [itemSupply, setItemSupply] = useState<string>('');
  const [classRequirementsToggle, setClassRequirementsToggle] =
    useState<boolean>(false);
  const [classRequirements, setClassRequirements] = useState<string[]>([]);
  const [soulboundToggle, setSoulboundToggle] = useState<boolean>(false);
  const [claimableToggle, setClaimableToggle] = useState<boolean>(false);

  const [claimableAddressList, setClaimableAddressList] = useState<
    ClaimableAddress[]
  >([]);

  const [showError, setShowError] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txFailed, setTxFailed] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSynced, setIsSynced] = useState<boolean>(false);

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
        BigInt(amount) > maxUint256 ||
        BigInt(amount).toString() === 'NaN',
    );
  }, [claimableAddressList, itemSupply]);

  const hasError = useMemo(() => {
    return (
      !itemDescription ||
      !itemEmblem ||
      !itemName ||
      invalidItemDescription ||
      !itemSupply ||
      invalidItemSupply ||
      invalidClaimableAddressList
    );
  }, [
    itemDescription,
    itemEmblem,
    itemName,
    invalidClaimableAddressList,
    invalidItemDescription,
    itemSupply,
    invalidItemSupply,
  ]);

  const resetData = useCallback(() => {
    setItemName('');
    setItemDescription('');
    setItemSupply('');
    setClassRequirementsToggle(false);
    setClassRequirements([]);
    setSoulboundToggle(false);
    setClaimableToggle(false);
    setClaimableAddressList([]);
    setItemEmblem(null);

    setShowError(false);

    setIsCreating(false);
    setTxHash(null);
    setIsSyncing(false);
    setIsSynced(false);
  }, [setItemEmblem]);

  useEffect(() => {
    if (!createItemModal?.isOpen) {
      resetData();
    }
  }, [resetData, createItemModal?.isOpen]);

  const onCreateItem = useCallback(
    async (e: React.FormEvent<HTMLDivElement>) => {
      e.preventDefault();

      if (hasError) {
        setShowError(true);
        return;
      }

      try {
        if (!walletClient) throw new Error('Wallet client is not connected');
        if (!(game && game.itemsAddress))
          throw new Error(
            `Missing item factory address for the ${walletClient.chain.name} network`,
          );

        const cid = await onUpload();
        if (!cid)
          throw new Error('Something went wrong uploading your item emblem');

        const itemMetadata = {
          name: itemName,
          description: itemDescription,
          image: `ipfs://${cid}`,
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
              console.error(
                'Something went wrong uploading your claimable tree.',
              );
              throw new Error(
                'Something went wrong uploading your claimable tree',
              );
            }
          }
        }

        const requiredClassIds = classRequirements.map(cr => BigInt(cr));
        const requiredClassCategories = requiredClassIds.map(() => 2);
        const requiredClassAddresses = requiredClassIds.map(
          () => game.classesAddress as Address,
        );
        // TODO: Make amount dynamic when class levels are added
        const requiredClassAmounts = requiredClassIds.map(() => BigInt(1));

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
            [...requiredClassCategories],
            [...requiredClassAddresses],
            [...requiredClassIds],
            [...requiredClassAmounts],
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
            BigInt(itemSupply), // refers to max amount a single character can hold
            BigInt(itemSupply),
            itemMetadataCid,
            requiredAssetsBytes,
          ],
        );

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
        setTxHash(transactionhash);

        const client = publicClient ?? walletClient;
        const { blockNumber, status } = await client.waitForTransactionReceipt({
          hash: transactionhash,
        });

        if (status === 'reverted') {
          setTxFailed(true);
          setIsCreating(false);
          throw new Error('Transaction failed');
        }

        setIsSyncing(true);
        const synced = await waitUntilBlock(client.chain.id, blockNumber);
        if (!synced) throw new Error('Something went wrong while syncing');

        setIsSynced(true);
        reloadGame();
      } catch (e) {
        renderError(e, 'Something went wrong creating your item');
      } finally {
        setIsSyncing(false);
        setIsCreating(false);
      }
    },
    [
      claimableToggle,
      classRequirements,
      itemName,
      itemDescription,
      itemSupply,
      game,
      reloadGame,
      hasError,
      onUpload,
      publicClient,
      renderError,
      soulboundToggle,
      walletClient,
      claimableAddressList,
    ],
  );

  const isLoading = isCreating;
  const isDisabled = isLoading || isUploading;

  const content = () => {
    if (txFailed) {
      return (
        <VStack py={10} spacing={4}>
          <Text>Transaction failed.</Text>
          <Button onClick={createItemModal?.onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

    if (isSynced) {
      return (
        <VStack py={10} spacing={4}>
          <Text>Your item was successfully created!</Text>
          <Button onClick={createItemModal?.onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

    if (txHash) {
      return (
        <TransactionPending
          isSyncing={isSyncing}
          text="Your item is being created."
          txHash={txHash}
          chainId={game?.chainId}
        />
      );
    }

    return (
      <VStack as="form" onSubmit={onCreateItem} spacing={8}>
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
          <FormLabel>Item Description (200 character limit)</FormLabel>
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
          <SimpleGrid columns={4} spacing={3} w="100%">
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
            setClaimableAddressList={setClaimableAddressList}
          />
        )}
        <FormControl isInvalid={showError && !itemEmblem}>
          <FormLabel>Item Emblem</FormLabel>
          {!itemEmblem && (
            <Input
              accept=".png, .jpg, .jpeg, .svg"
              disabled={isUploading}
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
                isDisabled={isUploading || isUploaded}
                isLoading={isUploading}
                loadingText="Uploading..."
                mt={4}
                onClick={!isUploaded ? onRemove : undefined}
                type="button"
                variant="outline"
              >
                {isUploaded ? 'Uploaded' : 'Remove'}
              </Button>
            </Flex>
          )}
          {showError && !itemEmblem && (
            <FormHelperText color="red">
              An item emblem is required
            </FormHelperText>
          )}
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
    );
  };

  return (
    <Modal
      closeOnEsc={!isLoading}
      closeOnOverlayClick={!isLoading}
      isOpen={createItemModal?.isOpen ?? false}
      onClose={createItemModal?.onClose ?? (() => {})}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Text>Create an Item</Text>
          <ModalCloseButton size="lg" />
        </ModalHeader>
        <ModalBody>{content()}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
