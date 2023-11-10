import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Image,
  Input,
  ListItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  UnorderedList,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAddress, pad, parseAbi } from 'viem';
import { Address, usePublicClient, useWalletClient } from 'wagmi';

import { TransactionPending } from '@/components/TransactionPending';
import { useGame } from '@/contexts/GameContext';
import { useItemActions } from '@/contexts/ItemActionsContext';
import { waitUntilBlock } from '@/graphql/health';
import { ClaimableItemLeaf, useClaimableTree } from '@/hooks/useClaimableTree';
import { useToast } from '@/hooks/useToast';
import { executeAsCharacter } from '@/utils/account';

export const ClaimItemModal: React.FC = () => {
  const { character, game, reload: reloadGame } = useGame();
  const { selectedItem, claimItemModal } = useItemActions();

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { renderError } = useToast();

  const [openDetails, setOpenDetails] = useState(-1); // -1 = closed, 0 = open
  const [amount, setAmount] = useState<string>('');

  const [showError, setShowError] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txFailed, setTxFailed] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSynced, setIsSynced] = useState<boolean>(false);

  const hasError = useMemo(
    () =>
      !amount ||
      BigInt(amount).toString() === 'NaN' ||
      BigInt(amount) <= BigInt(0) ||
      BigInt(amount) > BigInt(selectedItem?.supply || '0'),
    [amount, selectedItem],
  );

  const resetData = useCallback(() => {
    setOpenDetails(-1);
    setAmount('');
    setIsClaiming(false);
    setTxHash(null);
    setTxFailed(false);
    setIsSyncing(false);
    setIsSynced(false);
  }, []);

  useEffect(() => {
    setShowError(false);
  }, [amount]);

  const noSupply = useMemo(() => {
    if (!selectedItem) return false;
    const supply = BigInt(selectedItem.supply);
    if (Number.isNaN(Number(supply)) || supply <= 0) return true;
    return false;
  }, [selectedItem]);

  const insufficientClasses = useMemo(() => {
    if (!selectedItem) return false;
    if (!character) return false;
    const requirements = selectedItem.requirements || [];
    const classes = character.classes || [];
    return requirements.some(
      r => !classes.some(c => BigInt(c.classId) === BigInt(r.assetId)),
    );
  }, [selectedItem, character]);

  const {
    tree,
    loading: isLoadingTree,
    reload: reloadTree,
  } = useClaimableTree(selectedItem?.itemId);

  useEffect(() => {
    if (!claimItemModal?.isOpen) {
      resetData();
    } else {
      reloadTree();
    }
  }, [resetData, claimItemModal?.isOpen, reloadTree]);

  const claimableLeaves: Array<ClaimableItemLeaf> = useMemo(() => {
    if (!tree) return [];
    return tree.dump().values.map(leaf => {
      const [itemId, claimer, nonce, amount] = leaf.value;
      return [
        BigInt(itemId),
        getAddress(claimer),
        BigInt(nonce),
        BigInt(amount),
      ];
    });
  }, [tree]);

  const claimableLeaf: ClaimableItemLeaf | null = useMemo(() => {
    if (!character) return null;
    if (!selectedItem) return null;
    if (!tree) return null;
    if (tree.root.toLowerCase() !== selectedItem.merkleRoot.toLowerCase())
      return null;
    if (!claimableLeaves.length) return null;
    const claimableLeaf = claimableLeaves.find(
      leaf =>
        leaf[1] === getAddress(character.account) &&
        leaf[0] === BigInt(selectedItem.itemId),
    );
    if (!claimableLeaf) return null;
    return [
      BigInt(claimableLeaf[0]),
      getAddress(claimableLeaf[1]),
      BigInt(claimableLeaf[2]),
      BigInt(claimableLeaf[3]),
    ];
  }, [character, selectedItem, tree, claimableLeaves]);

  const claimableAmount: bigint = useMemo(() => {
    if (!claimableLeaf) return BigInt(0);
    return claimableLeaf[3];
  }, [claimableLeaf]);

  const isClaimableByPublic = useMemo(() => {
    if (!selectedItem) return false;
    if (selectedItem.merkleRoot === pad('0x00')) return true;
    return false;
  }, [selectedItem]);

  const isClaimableByMerkleProof = useMemo(() => {
    if (!selectedItem) return false;
    if (selectedItem.merkleRoot === pad('0x00')) return false;
    return claimableAmount > BigInt(0);
  }, [selectedItem, claimableAmount]);

  const onClaimItem = useCallback(
    async (e: React.FormEvent<HTMLDivElement>) => {
      e.preventDefault();
      try {
        if (noSupply) {
          throw new Error('This item has zero supply.');
        }

        if (hasError && isClaimableByPublic) {
          setShowError(true);
          return;
        }

        if (insufficientClasses) {
          setOpenDetails(0);
          throw new Error('You do not have the required classes');
        }

        if (!walletClient) {
          throw new Error('Could not find a wallet client');
        }

        if (!game?.itemsAddress) {
          throw new Error('Missing game data');
        }

        if (!character) {
          throw new Error('Character address not found');
        }

        if (!selectedItem) {
          throw new Error('Item not found');
        }

        setIsClaiming(true);

        if (!isClaimableByPublic && !tree) {
          console.error('Could not find the claimable tree.');
          throw new Error(
            `Something went wrong while claiming ${selectedItem.name}.`,
          );
        }

        const itemId = BigInt(selectedItem.itemId);

        let proof: string[] = [];
        let claimingAmount = BigInt(amount);

        if (
          isClaimableByMerkleProof &&
          tree &&
          claimableAmount > BigInt(0) &&
          claimableLeaf
        ) {
          proof = tree.getProof(claimableLeaf);
          claimingAmount = claimableAmount;
        } else if (!isClaimableByPublic) {
          console.error('Not claimable by public or merkle proof.');
          throw new Error(
            `Something went wrong while claiming ${selectedItem.name}.`,
          );
        }

        const transactionhash = await executeAsCharacter(
          character,
          walletClient,
          {
            chain: walletClient.chain,
            account: walletClient.account?.address as Address,
            address: game.itemsAddress as Address,
            abi: parseAbi([
              'function claimItems(uint256[] calldata itemIds, uint256[] calldata amounts, bytes32[][] calldata proofs) external',
            ]),
            functionName: 'claimItems',
            args: [[itemId], [claimingAmount], [proof]],
          },
        );
        setTxHash(transactionhash);

        const client = publicClient ?? walletClient;
        const { blockNumber, status } = await client.waitForTransactionReceipt({
          hash: transactionhash,
        });

        if (status === 'reverted') {
          setTxFailed(true);
          setIsClaiming(false);
          throw new Error('Transaction failed');
        }

        setIsSyncing(true);
        const synced = await waitUntilBlock(client.chain.id, blockNumber);

        if (!synced) {
          throw new Error('Something went wrong while syncing.');
        }
        setIsSynced(true);
        reloadGame();
      } catch (e) {
        renderError(e, 'An error occurred while claiming');
      } finally {
        setIsSyncing(false);
        setIsClaiming(false);
      }
    },
    [
      amount,
      character,
      game,
      hasError,
      insufficientClasses,
      noSupply,
      publicClient,
      selectedItem,
      reloadGame,
      renderError,
      walletClient,
      tree,
      isClaimableByPublic,
      claimableAmount,
      claimableLeaf,
      isClaimableByMerkleProof,
    ],
  );

  const isLoading = isClaiming;
  const isDisabled = isLoading;

  const content = () => {
    if (txFailed) {
      return (
        <VStack py={10} spacing={4}>
          <Text>Transaction failed.</Text>
          <Button onClick={claimItemModal?.onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

    if (isSynced && selectedItem) {
      return (
        <VStack py={10} spacing={4}>
          <Text>{selectedItem.name} has been claimed!</Text>
          <Button onClick={claimItemModal?.onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

    if (txHash && selectedItem) {
      return (
        <TransactionPending
          isSyncing={isSyncing}
          text={`Claiming ${selectedItem.name}...`}
          txHash={txHash}
          chainId={game?.chainId}
        />
      );
    }

    return (
      <VStack as="form" onSubmit={onClaimItem} spacing={8}>
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
        <Accordion allowToggle w="100%" index={openDetails}>
          <AccordionItem>
            <AccordionButton
              id="item-details-button"
              onClick={() => setOpenDetails(openDetails === 0 ? -1 : 0)}
            >
              <HStack justify="space-between" w="100%">
                <div />
                <Text>View Details</Text>
                <AccordionIcon />
              </HStack>
            </AccordionButton>
            <AccordionPanel>
              <VStack spacing={2}>
                <Text fontSize="sm">
                  Soulbound: {selectedItem?.soulbound ? 'true' : 'false'}
                </Text>
                <Text fontSize="sm" fontWeight="bold">
                  Required classes:
                </Text>
                {selectedItem && selectedItem.requirements.length > 0 ? (
                  <UnorderedList>
                    {selectedItem?.requirements.map((r, i) => {
                      const className = game?.classes.find(
                        c => BigInt(c.classId) === BigInt(r.assetId),
                      )?.name;
                      const classNotAssigned =
                        character?.classes.find(
                          c => BigInt(c.classId) === BigInt(r.assetId),
                        ) === undefined;

                      if (classNotAssigned) {
                        return (
                          <ListItem key={i}>
                            <Text fontSize="sm" color="red.500">
                              {className} (not assigned)
                            </Text>
                          </ListItem>
                        );
                      }
                      return (
                        <ListItem key={i}>
                          <Text fontSize="sm">{className}</Text>
                        </ListItem>
                      );
                    })}
                  </UnorderedList>
                ) : (
                  <Text fontSize="sm">None</Text>
                )}
              </VStack>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
        {!isLoadingTree && (
          <>
            {noSupply ? (
              <Text color="red.500">This item has zero supply.</Text>
            ) : isClaimableByPublic ? (
              <FormControl isInvalid={showError}>
                <FormLabel>Amount</FormLabel>
                <Input
                  onChange={e => setAmount(e.target.value)}
                  type="number"
                  value={amount}
                />
                {showError && (
                  <FormHelperText color="red">
                    Please enter a valid amount. Item supply is{' '}
                    {selectedItem?.supply.toString()}.
                  </FormHelperText>
                )}
              </FormControl>
            ) : (
              <FormControl isInvalid={!isClaimableByMerkleProof}>
                <FormLabel>Amount</FormLabel>
                <Input
                  isDisabled
                  type="number"
                  value={claimableAmount.toString()}
                />
                {claimableAmount === BigInt(0) && (
                  <FormHelperText color="red">
                    You cannot claim this item.
                  </FormHelperText>
                )}
              </FormControl>
            )}
          </>
        )}
        {isLoadingTree ? (
          <Text>Loading...</Text>
        ) : (
          <Button
            autoFocus
            isDisabled={isDisabled}
            isLoading={isLoading}
            loadingText="Claiming..."
            type="submit"
          >
            Claim
          </Button>
        )}
      </VStack>
    );
  };

  return (
    <Modal
      closeOnEsc={!isLoading}
      closeOnOverlayClick={!isLoading}
      isOpen={claimItemModal?.isOpen ?? false}
      onClose={claimItemModal?.onClose ?? (() => {})}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Text>Claim {selectedItem?.name ?? 'Item'}</Text>
          <ModalCloseButton size="lg" />
        </ModalHeader>
        <ModalBody>{content()}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
