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
  GridItem,
  HStack,
  Image,
  Input,
  ListItem,
  SimpleGrid,
  Text,
  UnorderedList,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Address, getAddress, pad, parseAbi } from 'viem';
import { useWalletClient } from 'wagmi';

import { useGame } from '@/contexts/GameContext';
import { useItemActions } from '@/contexts/ItemActionsContext';
import { ClaimableItemLeaf, useClaimableTree } from '@/hooks/useClaimableTree';
import { executeAsCharacter } from '@/utils/account';

import { ActionModal } from './ActionModal';

export const ClaimItemModal: React.FC = () => {
  const { character, game, reload: reloadGame } = useGame();
  const { selectedItem, claimItemModal } = useItemActions();

  const { data: walletClient } = useWalletClient();

  const [openDetails, setOpenDetails] = useState(-1); // -1 = closed, 0 = open
  const [amount, setAmount] = useState<string>('1');

  const [showError, setShowError] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);

  const existingAmount = useMemo(() => {
    if (!selectedItem || !character) return BigInt(0);
    const item = character?.heldItems.find(
      i => BigInt(i.itemId) === BigInt(selectedItem.itemId),
    );
    if (!item) return BigInt(0);
    return BigInt(item.amount);
  }, [selectedItem, character]);

  const distributionLeftToClaim = useMemo(() => {
    if (!selectedItem) return BigInt(0);
    return BigInt(selectedItem.distribution) - existingAmount;
  }, [selectedItem, existingAmount]);

  const hasError = useMemo(
    () =>
      !amount ||
      BigInt(amount).toString() === 'NaN' ||
      BigInt(amount) <= BigInt(0) ||
      BigInt(amount) > BigInt(distributionLeftToClaim),
    [amount, distributionLeftToClaim],
  );

  const errorText = useMemo(() => {
    if (!selectedItem) return '';
    if (!amount) return 'Please enter a valid amount.';
    if (BigInt(amount).toString() === 'NaN')
      return 'Please enter a valid amount.';
    if (BigInt(amount) <= BigInt(0)) return 'Please enter a valid amount.';
    if (BigInt(amount) > BigInt(distributionLeftToClaim)) {
      return `You can only claim up to ${distributionLeftToClaim.toString()} of this item.`;
    }
    return '';
  }, [amount, selectedItem, distributionLeftToClaim]);

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

  const requiredXp = useMemo(() => {
    if (!selectedItem) return BigInt(0);
    return BigInt(
      selectedItem.requirements.filter(r => r.assetCategory === 'ERC20')[0]
        ?.amount ?? '0',
    );
  }, [selectedItem]);

  const insufficientXp = useMemo(() => {
    if (!character) return false;
    return BigInt(character.experience) < requiredXp;
  }, [character, requiredXp]);

  const {
    tree,
    loading: isLoadingTree,
    reload: reloadTree,
  } = useClaimableTree(selectedItem?.itemId);

  const resetData = useCallback(() => {
    setOpenDetails(-1);
    setAmount('1');
    setIsClaiming(false);
    reloadTree();
  }, [reloadTree]);

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

  const onClaimItem = useCallback(async () => {
    if (noSupply) {
      throw new Error('This item has zero supply.');
    }

    if (hasError && isClaimableByPublic) {
      setShowError(true);
      return null;
    }

    if (insufficientClasses) {
      setOpenDetails(0);
      throw new Error('You do not have the required classes');
    }

    if (insufficientXp) {
      setOpenDetails(0);
      throw new Error('You do not have the required XP');
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

    try {
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
      return transactionhash;
    } catch (e) {
      throw e;
    } finally {
      setIsClaiming(false);
    }
  }, [
    amount,
    character,
    game,
    hasError,
    insufficientClasses,
    insufficientXp,
    noSupply,
    selectedItem,
    walletClient,
    tree,
    isClaimableByPublic,
    claimableAmount,
    claimableLeaf,
    isClaimableByMerkleProof,
  ]);

  const isLoading = isClaiming;

  const isDisabled = isLoading;

  return (
    <ActionModal
      {...{
        isOpen: claimItemModal?.isOpen,
        onClose: claimItemModal?.onClose,
        header: `Claim ${selectedItem?.name ?? 'Item'}`,
        loadingText: `Claiming item...`,
        successText: 'Item successfully claimed!',
        errorText: 'There was an error claiming this item.',
        resetData,
        onAction: onClaimItem,
        onComplete: reloadGame,
      }}
    >
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
            <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4}>
              <GridItem>
                <Text fontSize="sm" fontWeight="bold">
                  Required classes:
                </Text>
                {selectedItem && selectedItem.requirements.length > 0 ? (
                  <UnorderedList>
                    {selectedItem?.requirements
                      .filter(req => req.assetCategory === 'ERC1155')
                      .map((r, i) => {
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
              </GridItem>

              <GridItem>
                <Text fontSize="sm" fontWeight="bold">
                  Required XP:
                </Text>
                <Text
                  color={insufficientXp ? 'red.500' : 'white'}
                  fontSize="sm"
                >
                  {requiredXp.toString()}
                </Text>
              </GridItem>

              <GridItem>
                <Text fontSize="sm" fontWeight="bold">
                  Soulbound:
                </Text>
                <Text fontSize="sm">
                  {selectedItem?.soulbound ? 'True' : 'False'}
                </Text>
              </GridItem>
            </SimpleGrid>
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
                max={distributionLeftToClaim.toString()}
              />
              {showError && (
                <FormHelperText color="red">{errorText}</FormHelperText>
              )}
            </FormControl>
          ) : (
            <FormControl isInvalid={!isClaimableByMerkleProof}>
              <FormLabel>Amount</FormLabel>
              <Input
                isDisabled
                type="number"
                value={
                  claimableAmount === distributionLeftToClaim
                    ? claimableAmount.toString()
                    : '0'
                }
              />
              {(claimableAmount === BigInt(0) ||
                claimableAmount !== distributionLeftToClaim) && (
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
          variant="solid"
          alignSelf="flex-end"
        >
          Claim
        </Button>
      )}
    </ActionModal>
  );
};
