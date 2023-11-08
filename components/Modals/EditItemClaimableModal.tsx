import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Switch,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getAddress,
  isAddress,
  maxUint256,
  pad,
  parseAbi,
  zeroAddress,
} from 'viem';
import { Address, usePublicClient, useWalletClient } from 'wagmi';

import { TransactionPending } from '@/components/TransactionPending';
import { useGame } from '@/contexts/GameContext';
import { useItemActions } from '@/contexts/ItemActionsContext';
import { waitUntilBlock } from '@/graphql/health';
import { ClaimableItemLeaf, useClaimableTree } from '@/hooks/useClaimableTree';
import { useToast } from '@/hooks/useToast';

import {
  ClaimableAddress,
  ClaimableAddressListInput,
} from '../ClaimableAddressListInput';

const getClaimNonce = async (
  publicClient: ReturnType<typeof usePublicClient>,
  itemsAddress: Address,
  itemId: bigint,
  account: Address,
) => {
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

export const EditItemClaimableModal: React.FC = () => {
  const { game, reload: reloadGame } = useGame();
  const { selectedItem, editItemClaimableModal } = useItemActions();

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { renderError } = useToast();

  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSynced, setIsSynced] = useState<boolean>(false);
  const [txFailed, setTxFailed] = useState<boolean>(false);

  const [claimableToggle, setClaimableToggle] = useState<boolean>(false);

  const [claimableAddressList, setClaimableAddressList] = useState<
    ClaimableAddress[]
  >([]);

  const resetData = useCallback(() => {
    setIsUpdating(false);
    setTxHash(null);
    setTxFailed(false);
    setIsSyncing(false);
    setIsSynced(false);
  }, []);

  const noSupply = useMemo(() => {
    if (!selectedItem) return false;
    const supply = BigInt(selectedItem.supply);
    if (Number.isNaN(supply) || supply <= 0) return true;
    return false;
  }, [selectedItem]);

  const invalidClaimableAddressList = useMemo(() => {
    if (!selectedItem) return false;
    if (!claimableToggle) return false;
    const totalAmount = claimableAddressList.reduce(
      (acc, { amount }) => acc + BigInt(amount),
      BigInt(0),
    );
    if (totalAmount > BigInt(selectedItem.supply)) return true;
    return claimableAddressList.some(
      ({ address, amount }) =>
        !isAddress(address) ||
        BigInt(amount) <= BigInt(0) ||
        BigInt(amount) > maxUint256 ||
        BigInt(amount).toString() === 'NaN',
    );
  }, [claimableAddressList, selectedItem, claimableToggle]);

  const {
    tree,
    loading: isLoadingTree,
    reload: reloadTree,
  } = useClaimableTree(
    (game?.id || zeroAddress) as `0x${string}`,
    BigInt(selectedItem?.itemId || '0'),
  );

  useEffect(() => {
    if (!editItemClaimableModal?.isOpen) {
      resetData();
    } else {
      reloadTree();
    }
  }, [resetData, editItemClaimableModal?.isOpen, reloadTree]);

  useEffect(() => {
    if (isUpdating) return;
    if (!selectedItem) return;
    if (selectedItem.merkleRoot === pad('0x00')) {
      setClaimableToggle(true);
      setClaimableAddressList([]);
    } else if (selectedItem.merkleRoot === pad('0x01')) {
      setClaimableToggle(false);
      setClaimableAddressList([]);
    } else {
      setClaimableToggle(true);
      const dumpValues = tree?.dump().values || [];
      if (!tree || dumpValues.length === 0) {
        setClaimableAddressList([]);
        return;
      }
      const itemId = BigInt(selectedItem?.itemId ?? '0');
      const itemIdFromTree = BigInt(dumpValues[0].value[0]);
      if (itemId !== itemIdFromTree) {
        setClaimableAddressList([]);
        return;
      }
      const list = dumpValues.map(leaf => {
        const [, claimer, amount] = leaf.value;
        return {
          address: claimer,
          amount: BigInt(amount),
        };
      });
      setClaimableAddressList(list);
    }
  }, [selectedItem, tree, isUpdating]);

  const onUpdateClaimable = useCallback(
    async (e: React.FormEvent<HTMLDivElement>) => {
      e.preventDefault();

      try {
        if (noSupply) {
          throw new Error('This item has zero supply.');
        }

        if (invalidClaimableAddressList) {
          throw new Error('Invalid claimable address list.');
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

        let claimable = pad('0x01');

        if (claimableToggle) {
          if (claimableAddressList.length === 0) {
            claimable = pad('0x00');
          } else {
            const leaves: ClaimableItemLeaf[] = await Promise.all(
              claimableAddressList.map(async ({ address, amount }) => {
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
            claimable = tree.root as `0x${string}`;

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
            };

            const signature = await walletClient.signMessage({
              message: '/api/setTree',
              account: walletClient.account?.address as Address,
            });

            const res = await fetch('/api/setTree', {
              headers: {
                'x-account-address': walletClient.account?.address as Address,
                'x-account-signature': signature,
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

        if (claimable.toLowerCase() === selectedItem.merkleRoot.toLowerCase()) {
          throw new Error('No changes were made.');
        }

        const transactionhash = await walletClient.writeContract({
          chain: walletClient.chain,
          account: walletClient.account?.address as Address,
          address: game.itemsAddress as Address,
          abi: parseAbi([
            'function updateItemClaimable(uint256 itemId, bytes32 merkleRoot, uint256 newDistribution) external',
          ]),
          functionName: 'updateItemClaimable',
          args: [itemId, claimable, BigInt(selectedItem.supply)],
        });
        setTxHash(transactionhash);

        const client = publicClient ?? walletClient;

        const { blockNumber, status } = await client.waitForTransactionReceipt({
          hash: transactionhash,
        });

        if (status === 'reverted') {
          setTxFailed(true);
          setIsUpdating(false);
          throw new Error('Transaction failed');
        }

        setIsSyncing(true);
        const synced = await waitUntilBlock(client.chain.id, blockNumber);
        if (!synced) throw new Error('Something went wrong while syncing');
        setIsSynced(true);
        reloadGame();
      } catch (e) {
        renderError(e, 'An error occurred while updating claimability.');
        console.error(e);
      } finally {
        setIsSyncing(false);
        setIsUpdating(false);
      }
    },
    [
      game,
      noSupply,
      publicClient,
      selectedItem,
      reloadGame,
      walletClient,
      claimableToggle,
      claimableAddressList,
      renderError,
      invalidClaimableAddressList,
    ],
  );

  const isLoading = isUpdating;
  const isDisabled = isLoading;

  const content = () => {
    if (txFailed) {
      return (
        <VStack py={10} spacing={4}>
          <Text>Transaction failed.</Text>
          <Button onClick={editItemClaimableModal?.onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

    if (isSynced && selectedItem) {
      return (
        <VStack py={10} spacing={4}>
          <Text>Claimability has been updated for {selectedItem.name}!</Text>
          <Button onClick={editItemClaimableModal?.onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

    if (txHash && selectedItem) {
      return (
        <TransactionPending
          isSyncing={isSyncing}
          text={`Updating ${selectedItem.name}...`}
          txHash={txHash}
          chainId={game?.chainId}
        />
      );
    }

    return (
      <VStack as="form" onSubmit={onUpdateClaimable} spacing={8}>
        <VStack justify="space-between" h="100%" spacing={6}>
          <Image
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
            onChange={e => setClaimableToggle(e.target.checked)}
          />
        </FormControl>
        {claimableToggle && (
          <ClaimableAddressListInput
            claimableAddressList={claimableAddressList}
            itemSupply={selectedItem?.supply.toString() ?? '0'}
            setClaimableAddressList={setClaimableAddressList}
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
          >
            Update
          </Button>
        )}
      </VStack>
    );
  };

  return (
    <Modal
      closeOnEsc={!isLoading}
      closeOnOverlayClick={!isLoading}
      isOpen={editItemClaimableModal?.isOpen ?? false}
      onClose={editItemClaimableModal?.onClose ?? (() => {})}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Text>Edit Claimability for {selectedItem?.name ?? 'Item'}</Text>
          <ModalCloseButton size="lg" />
        </ModalHeader>
        <ModalBody>{content()}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
