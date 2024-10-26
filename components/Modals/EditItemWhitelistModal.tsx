import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Image,
  Input,
  Switch,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Address,
  getAddress,
  isAddress,
  maxUint256,
  pad,
  parseAbi,
} from 'viem';
import { usePublicClient, useWalletClient } from 'wagmi';

import { useGame } from '@/contexts/GameContext';
import { useItemActions } from '@/contexts/ItemActionsContext';
import { useWhitelistTree, WhitelistItemLeaf } from '@/hooks/useWhitelistTree';

import { MultiSourceImage } from '../MultiSourceImage';
import {
  WhitelistAddress,
  WhitelistAddressListInput,
} from '../WhitelistAddressListInput';
import { ActionModal } from './ActionModal';

const getClaimNonce = async (
  publicClient: ReturnType<typeof usePublicClient>,
  itemsAddress: Address,
  itemId: bigint,
  account: Address,
) => {
  if (!publicClient) {
    throw new Error('Could not find a public client');
  }

  const nonce = (await publicClient.readContract({
    address: itemsAddress,
    abi: parseAbi([
      'function getClaimNonce(uint256 itemId, address character) public view returns (uint256)',
    ]),
    functionName: 'getClaimNonce',
    args: [itemId, account],
  })) as bigint;

  return nonce;
};

export const EditItemWhitelistModal: React.FC = () => {
  const { game, reload: reloadGame } = useGame();
  const { selectedItem, editItemWhitelistModal } = useItemActions();

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const [itemDistribution, setItemDistribution] = useState<string>(
    selectedItem?.distribution.toString() ?? '0',
  );
  const [whitelistToggle, setWhitelistToggle] = useState<boolean>(false);

  const [whitelistAddressList, setWhitelistAddressList] = useState<
    WhitelistAddress[]
  >([]);

  const noSupply = useMemo(() => {
    if (!selectedItem) return false;
    const supply = BigInt(selectedItem.supply);
    if (Number.isNaN(supply) || supply <= 0) return true;
    return false;
  }, [selectedItem]);

  const itemSupply = selectedItem?.supply.toString() ?? '0';

  const invalidItemDistribution = useMemo(() => {
    return (
      !itemDistribution ||
      BigInt(itemDistribution).toString() === 'NaN' ||
      BigInt(itemDistribution) <= BigInt(0) ||
      BigInt(itemDistribution) > maxUint256 ||
      BigInt(itemDistribution) > BigInt(itemSupply)
    );
  }, [itemDistribution, itemSupply]);

  const invalidWhitelistAddressList = useMemo(() => {
    if (!selectedItem) return false;
    if (!whitelistToggle) return false;
    const totalAmount = whitelistAddressList.reduce(
      (acc, { amount }) => acc + BigInt(amount),
      BigInt(0),
    );
    if (totalAmount > BigInt(selectedItem.supply)) return true;
    return whitelistAddressList.some(
      ({ address, amount }) =>
        !isAddress(address) ||
        BigInt(amount) <= BigInt(0) ||
        BigInt(amount) > BigInt(itemDistribution) ||
        BigInt(amount).toString() === 'NaN',
    );
  }, [whitelistAddressList, selectedItem, whitelistToggle, itemDistribution]);

  const {
    tree,
    loading: isLoadingTree,
    reload: reloadTree,
  } = useWhitelistTree(selectedItem?.itemId);

  const resetData = useCallback(() => {
    setIsUpdating(false);
    setItemDistribution(selectedItem?.distribution.toString() ?? '0');
    reloadTree();
  }, [selectedItem, reloadTree]);

  useEffect(() => {
    if (isUpdating) return;
    if (!selectedItem) return;
    if (selectedItem.merkleRoot === pad('0x00')) {
      setWhitelistToggle(true);
      setWhitelistAddressList([]);
    } else if (selectedItem.merkleRoot === pad('0x01')) {
      setWhitelistToggle(false);
      setWhitelistAddressList([]);
    } else {
      setWhitelistToggle(true);
      const dumpValues = tree?.dump().values || [];
      if (!tree || dumpValues.length === 0) {
        setWhitelistAddressList([]);
        return;
      }
      const itemId = BigInt(selectedItem?.itemId ?? '0');
      const itemIdFromTree = BigInt(dumpValues[0].value[0]);
      if (itemId !== itemIdFromTree) {
        setWhitelistAddressList([]);
        return;
      }
      const list = dumpValues.map(leaf => {
        const [, claimer, amount] = leaf.value;
        return {
          address: claimer,
          amount: BigInt(amount),
        };
      });
      setWhitelistAddressList(list);
    }
  }, [selectedItem, tree, isUpdating]);

  const onUpdateWhitelist = useCallback(async () => {
    try {
      if (noSupply) {
        throw new Error('This item has zero supply.');
      }

      if (invalidItemDistribution) {
        throw new Error('Invalid item distribution.');
      }

      if (invalidWhitelistAddressList) {
        throw new Error('Invalid whitelist address list.');
      }

      if (!walletClient) {
        throw new Error('Could not find a wallet client');
      }

      if (!game?.itemsAddress) {
        throw new Error('Missing game data');
      }

      if (!selectedItem) {
        throw new Error('Item not found');
      }

      setIsUpdating(true);

      const itemId = BigInt(selectedItem.itemId);

      let whitelist = pad('0x01');

      if (whitelistToggle) {
        if (whitelistAddressList.length === 0) {
          whitelist = pad('0x00');
        } else {
          const leaves: WhitelistItemLeaf[] = await Promise.all(
            whitelistAddressList.map(async ({ address, amount }) => {
              const nonce = await getClaimNonce(
                publicClient,
                game.itemsAddress as Address,
                itemId,
                address,
              );
              return [
                BigInt(itemId),
                getAddress(address),
                nonce,
                BigInt(amount),
              ];
            }),
          );

          const tree = StandardMerkleTree.of(leaves, [
            'uint256',
            'address',
            'uint256',
            'uint256',
          ]);
          whitelist = tree.root as `0x${string}`;

          if (
            tree.root.toLowerCase() === selectedItem.merkleRoot.toLowerCase()
          ) {
            throw new Error('No changes were made.');
          }

          const jsonTree = JSON.stringify(tree.dump());
          const data = {
            itemId: itemId.toString(),
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
              'Something went wrong uploading your whitelist tree.',
            );
            throw new Error(
              'Something went wrong uploading your whitelist tree',
            );
          }
        }
      }

      if (
        whitelist.toLowerCase() === selectedItem.merkleRoot.toLowerCase() &&
        Number(itemDistribution) === Number(selectedItem.distribution)
      ) {
        throw new Error('No changes were made.');
      }

      const transactionhash = await walletClient.writeContract({
        chain: walletClient.chain,
        account: walletClient.account?.address as Address,
        address: game.itemsAddress as Address,
        abi: parseAbi([
          'function updateItemWhitelist(uint256 itemId, bytes32 merkleRoot, uint256 newDistribution) external',
        ]),
        functionName: 'updateItemWhitelist',
        args: [itemId, whitelist, BigInt(selectedItem.supply)],
      });

      return transactionhash;
    } catch (e) {
      throw e;
    } finally {
      setIsUpdating(false);
    }
  }, [
    game,
    publicClient,
    itemDistribution,
    noSupply,
    selectedItem,
    walletClient,
    whitelistToggle,
    whitelistAddressList,
    invalidWhitelistAddressList,
    invalidItemDistribution,
  ]);

  const isLoading = isUpdating;
  const isDisabled = isLoading;

  return (
    <ActionModal
      {...{
        isOpen: editItemWhitelistModal?.isOpen,
        onClose: editItemWhitelistModal?.onClose,
        header: `Edit Whitelist for ${selectedItem?.name ?? 'Item'}`,
        loadingText: `Updating ${selectedItem?.name}...`,
        successText: `Item whitelist has been updated for ${selectedItem?.name}!`,
        errorText: 'There was an error updating item whitelist.',
        resetData,
        onAction: onUpdateWhitelist,
        onComplete: reloadGame,
      }}
    >
      <VStack as="form" onSubmit={onUpdateWhitelist} spacing={8}>
        <VStack justify="space-between" h="100%" spacing={6}>
          <MultiSourceImage
            alt={`${selectedItem?.name} image`}
            h="140px"
            objectFit="contain"
            src={selectedItem?.image}
            w="100%"
          />
          <Text>
            Supply: {selectedItem?.supply.toString()} /{' '}
            {selectedItem?.totalSupply.toString()}
          </Text>
        </VStack>
        <FormControl>
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
        </FormControl>
        <FormControl>
          <Flex align="center">
            <FormLabel>Allow players to obtain?</FormLabel>
            <Tooltip label="If you don't allow players to obtain, then items can only be given by the GameMaster.">
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
            isChecked={whitelistToggle}
            onChange={e => setWhitelistToggle(e.target.checked)}
          />
        </FormControl>
        {whitelistToggle && (
          <WhitelistAddressListInput
            whitelistAddressList={whitelistAddressList}
            itemSupply={selectedItem?.supply.toString() ?? '0'}
            itemDistribution={itemDistribution}
            setWhitelistAddressList={setWhitelistAddressList}
          />
        )}
        {isLoadingTree ? (
          <Text>Loading...</Text>
        ) : (
          <Button
            autoFocus
            isDisabled={isDisabled}
            isLoading={isLoading}
            loadingText="Updating..."
            type="submit"
            variant="solid"
            alignSelf="flex-end"
          >
            Update
          </Button>
        )}
      </VStack>
    </ActionModal>
  );
};
