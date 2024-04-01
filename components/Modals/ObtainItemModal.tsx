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
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Address, getAddress, pad, parseAbi } from 'viem';
import { useWalletClient } from 'wagmi';

import { useGame } from '@/contexts/GameContext';
import { useItemActions } from '@/contexts/ItemActionsContext';
import { useIsApprovedForAll } from '@/hooks/useIsApprovedForAll';
import { useWhitelistTree, WhitelistItemLeaf } from '@/hooks/useWhitelistTree';
import { executeAsCharacter } from '@/utils/account';
import {
  checkClaimRequirements,
  checkCraftRequirements,
} from '@/utils/requirements';

import { RequirementNodeDisplay } from '../ClaimRequirementsInput';
import { ActionModal } from './ActionModal';

export const ObtainItemModal: React.FC = () => {
  const { character, game, reload: reloadGame } = useGame();
  const { selectedItem, obtainItemModal } = useItemActions();

  const isCraftable = selectedItem?.craftable ?? false;

  const { data: walletClient } = useWalletClient();

  const [openDetails, setOpenDetails] = useState(-1); // -1 = closed, 0 = open
  const [amount, setAmount] = useState<string>('1');

  const [showError, setShowError] = useState<boolean>(false);
  const [isObtaining, setIsObtaining] = useState<boolean>(false);

  const existingAmount = useMemo(() => {
    if (!selectedItem || !character) return BigInt(0);
    const item = character?.heldItems.find(
      i => BigInt(i.itemId) === BigInt(selectedItem.itemId),
    );
    if (!item) return BigInt(0);
    return BigInt(item.amount);
  }, [selectedItem, character]);

  const distributionLeftToObtain = useMemo(() => {
    if (!selectedItem) return BigInt(0);
    return BigInt(selectedItem.distribution) - existingAmount;
  }, [selectedItem, existingAmount]);

  const hasError = useMemo(
    () =>
      !amount ||
      BigInt(amount).toString() === 'NaN' ||
      BigInt(amount) <= BigInt(0) ||
      BigInt(amount) > BigInt(distributionLeftToObtain),
    [amount, distributionLeftToObtain],
  );

  const errorText = useMemo(() => {
    if (!selectedItem) return '';
    if (!amount) return 'Please enter a valid amount.';
    if (BigInt(amount).toString() === 'NaN')
      return 'Please enter a valid amount.';
    if (BigInt(amount) <= BigInt(0)) return 'Please enter a valid amount.';
    if (BigInt(amount) > BigInt(distributionLeftToObtain)) {
      return `You can only obtain up to ${distributionLeftToObtain.toString()} of this item.`;
    }
    return '';
  }, [amount, selectedItem, distributionLeftToObtain]);

  useEffect(() => {
    setShowError(false);
  }, [amount]);

  const noSupply = useMemo(() => {
    if (!selectedItem) return false;
    const supply = BigInt(selectedItem.supply);
    if (Number.isNaN(Number(supply)) || supply <= 0) return true;
    return false;
  }, [selectedItem]);

  const noDistribution = useMemo(() => {
    if (!selectedItem) return false;
    if (
      Number.isNaN(Number(distributionLeftToObtain)) ||
      distributionLeftToObtain <= 0
    )
      return true;
    return false;
  }, [selectedItem, distributionLeftToObtain]);

  const {
    tree,
    loading: isLoadingTree,
    reload: reloadTree,
  } = useWhitelistTree(selectedItem?.itemId);

  const resetData = useCallback(() => {
    setOpenDetails(-1);
    setAmount('1');
    setIsObtaining(false);
    reloadTree();
  }, [reloadTree]);

  const whitelistLeaves: Array<WhitelistItemLeaf> = useMemo(() => {
    if (!tree) return [];
    return tree.dump().values.map(leaf => {
      const [itemId, obtainer, nonce, amount] = leaf.value;
      return [
        BigInt(itemId),
        getAddress(obtainer),
        BigInt(nonce),
        BigInt(amount),
      ];
    });
  }, [tree]);

  const whitelistLeaf: WhitelistItemLeaf | null = useMemo(() => {
    if (!character) return null;
    if (!selectedItem) return null;
    if (!tree) return null;
    if (tree.root.toLowerCase() !== selectedItem.merkleRoot.toLowerCase())
      return null;
    if (!whitelistLeaves.length) return null;
    const whitelistLeaf = whitelistLeaves.find(
      leaf =>
        leaf[1] === getAddress(character.account) &&
        leaf[0] === BigInt(selectedItem.itemId),
    );
    if (!whitelistLeaf) return null;
    return [
      BigInt(whitelistLeaf[0]),
      getAddress(whitelistLeaf[1]),
      BigInt(whitelistLeaf[2]),
      BigInt(whitelistLeaf[3]),
    ];
  }, [character, selectedItem, tree, whitelistLeaves]);

  const whitelistedAmount: bigint = useMemo(() => {
    if (!whitelistLeaf) return BigInt(0);
    return whitelistLeaf[3];
  }, [whitelistLeaf]);

  const isWhitelistedForAll = useMemo(() => {
    if (!selectedItem) return false;
    if (selectedItem.merkleRoot === pad('0x00')) return true;
    return false;
  }, [selectedItem]);

  const isWhitelistedByMerkleProof = useMemo(() => {
    if (!selectedItem) return false;
    if (selectedItem.merkleRoot === pad('0x00')) return false;
    return whitelistedAmount > BigInt(0);
  }, [selectedItem, whitelistedAmount]);

  const { isApprovedForAll } = useIsApprovedForAll(
    game?.itemsAddress,
    character?.account,
    game?.itemsManager,
  );

  const satisfiesClaimRequirements = useMemo(() => {
    if (!selectedItem) return false;
    if (!character) return false;
    if (!game) return false;
    return checkClaimRequirements(
      selectedItem.claimRequirements,
      game,
      character,
    );
  }, [selectedItem, character, game]);

  const satisfiesCraftRequirements = useMemo(() => {
    if (!selectedItem) return false;
    if (!character) return false;
    if (!amount) return false;
    return checkCraftRequirements(
      selectedItem.craftRequirements,
      character,
      BigInt(amount),
    );
  }, [selectedItem, character, amount]);

  const onObtainItem = useCallback(async () => {
    try {
      if (noSupply) {
        throw new Error('This item has zero supply.');
      }

      if (noDistribution) {
        throw new Error(
          'You have already claimed the maximum amount of this item.',
        );
      }

      if (hasError && isWhitelistedForAll) {
        setShowError(true);
        return null;
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

      setIsObtaining(true);

      if (!isWhitelistedForAll && !tree) {
        console.error('Could not find the whitelist tree.');
        throw new Error(
          `Something went wrong while obtaining ${selectedItem.name}.`,
        );
      }

      const itemId = BigInt(selectedItem.itemId);

      let proof: string[] = [];
      let obtainingAmount = BigInt(amount);

      if (
        isWhitelistedByMerkleProof &&
        tree &&
        whitelistedAmount > BigInt(0) &&
        whitelistLeaf
      ) {
        proof = tree.getProof(whitelistLeaf);
        obtainingAmount = whitelistedAmount;
      } else if (!isWhitelistedForAll) {
        console.error('Not whitelist by public or merkle proof.');
        throw new Error(
          `Something went wrong while obtaining ${selectedItem.name}.`,
        );
      }

      if (isCraftable && !satisfiesCraftRequirements) {
        throw new Error(
          'You do not have the required items to craft this item.',
        );
      }

      if (
        !isCraftable &&
        !!selectedItem?.claimRequirements &&
        !satisfiesClaimRequirements
      ) {
        throw new Error('You do not meet the requirements to claim this item.');
      }

      const approvalTxs =
        isCraftable && !isApprovedForAll
          ? [
              {
                chain: walletClient.chain,
                account: walletClient.account?.address as Address,
                address: game.itemsAddress as Address,
                abi: parseAbi([
                  'function setApprovalForAll(address operator, bool approved) external',
                ]),
                functionName: 'setApprovalForAll',
                args: [game.itemsManager as Address, true],
              },
            ]
          : [];

      const transactionhash = await executeAsCharacter(
        character,
        walletClient,
        [
          ...approvalTxs,
          {
            chain: walletClient.chain,
            account: walletClient.account?.address as Address,
            address: game.itemsAddress as Address,
            abi: parseAbi([
              'function obtainItems(uint256 itemId, uint256 amount, bytes32[] calldata proof) external',
            ]),
            functionName: 'obtainItems',
            args: [itemId, obtainingAmount, proof],
          },
        ],
      );
      return transactionhash;
    } catch (e) {
      throw e;
    } finally {
      setIsObtaining(false);
    }
  }, [
    amount,
    character,
    game,
    hasError,
    noSupply,
    noDistribution,
    selectedItem,
    walletClient,
    tree,
    isWhitelistedForAll,
    whitelistedAmount,
    whitelistLeaf,
    isWhitelistedByMerkleProof,
    isApprovedForAll,
    isCraftable,
    satisfiesClaimRequirements,
    satisfiesCraftRequirements,
  ]);

  const isLoading = isObtaining;

  const isDisabled = isLoading || noSupply || noDistribution;

  return (
    <ActionModal
      {...{
        isOpen: obtainItemModal?.isOpen,
        onClose: obtainItemModal?.onClose,
        header: `Obtain ${selectedItem?.name ?? 'Item'}`,
        loadingText: `Obtaining item...`,
        successText: 'Item successfully obtained!',
        errorText: 'There was an error obtaining this item.',
        resetData,
        onAction: onObtainItem,
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
                  Craftable:
                </Text>
                <Text fontSize="sm">
                  {selectedItem?.craftable ? 'True' : 'False'}
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

              <GridItem>
                <Text fontSize="sm" fontWeight="bold">
                  Holding Limit:
                </Text>
                <Text fontSize="sm">
                  {selectedItem?.distribution.toString()}
                </Text>
              </GridItem>
            </SimpleGrid>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
      {!isLoadingTree && (
        <>
          {noSupply && <Text color="red.500">This item has zero supply.</Text>}
          {noDistribution && (
            <Text color="red.500">
              You have already claimed the maximum amount of this item.
            </Text>
          )}
          {!noSupply && !noDistribution && (
            <>
              {isCraftable && (
                <>
                  <Text>
                    You can craft this item by combining the following items:
                  </Text>
                  <VStack>
                    {selectedItem?.craftRequirements.map((req, i) => {
                      const item = game?.items.find(
                        item => BigInt(item.itemId) === BigInt(req.itemId),
                      );
                      return (
                        <HStack key={i}>
                          <Image
                            alt={`${item?.name} image`}
                            h="40px"
                            objectFit="contain"
                            src={item?.image}
                            w="40px"
                          />
                          <Text>
                            {item?.name} x {req.amount}
                          </Text>
                        </HStack>
                      );
                    })}
                  </VStack>
                  {!satisfiesCraftRequirements && (
                    <Text color="red.500" size="sm">
                      You do not have the required items to craft this item.
                    </Text>
                  )}
                </>
              )}
              {!isCraftable && !!selectedItem?.claimRequirements && (
                <>
                  <Text>
                    You must satisfy the following requirements to claim this:
                  </Text>
                  <RequirementNodeDisplay
                    node={selectedItem.claimRequirements}
                    isEditable={false}
                  />
                  {!satisfiesClaimRequirements && (
                    <Text color="red.500" size="sm">
                      You do not meet the requirements to claim this item.
                    </Text>
                  )}
                </>
              )}

              {isWhitelistedForAll ? (
                <FormControl isInvalid={showError}>
                  <FormLabel>
                    Amount to {isCraftable ? 'craft' : 'claim'}
                  </FormLabel>
                  <Input
                    onChange={e => setAmount(e.target.value)}
                    type="number"
                    value={amount}
                    max={distributionLeftToObtain.toString()}
                  />
                  {showError && (
                    <FormHelperText color="red">{errorText}</FormHelperText>
                  )}
                </FormControl>
              ) : (
                <FormControl isInvalid={!isWhitelistedByMerkleProof}>
                  <FormLabel>
                    Amount to {isCraftable ? 'craft' : 'claim'}
                  </FormLabel>
                  <Input
                    isDisabled
                    type="number"
                    value={
                      whitelistedAmount === distributionLeftToObtain
                        ? whitelistedAmount.toString()
                        : '0'
                    }
                  />
                  {(whitelistedAmount === BigInt(0) ||
                    whitelistedAmount !== distributionLeftToObtain) && (
                    <FormHelperText color="red">
                      You cannot obtain this item.
                    </FormHelperText>
                  )}
                </FormControl>
              )}
            </>
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
          loadingText="Obtaining..."
          type="submit"
          variant="solid"
          alignSelf="flex-end"
        >
          {isCraftable ? 'Craft Item' : 'Claim Item'}
        </Button>
      )}
    </ActionModal>
  );
};
