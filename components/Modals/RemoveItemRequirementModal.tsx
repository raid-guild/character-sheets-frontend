import {
  Button,
  Flex,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  useRadioGroup,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';
import { parseAbi } from 'viem';
import { Address, usePublicClient, useWalletClient } from 'wagmi';

import { RadioCard } from '@/components/RadioCard';
import { TransactionPending } from '@/components/TransactionPending';
import { useGame } from '@/contexts/GameContext';
import { useItemActions } from '@/contexts/ItemActionsContext';
import { waitUntilBlock } from '@/hooks/useGraphHealth';
import { useToast } from '@/hooks/useToast';

export const RemoveItemRequirementModal: React.FC = () => {
  const { character, game, reload: reloadGame } = useGame();
  const { selectedItem, removeRequirementModal } = useItemActions();

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { renderError } = useToast();

  const [classId, setClassId] = useState<string>('1');

  const [isRemoving, setIsRemoving] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txFailed, setTxFailed] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSynced, setIsSynced] = useState<boolean>(false);

  // TODO: For now we are only removing class requirements
  const itemClassRequirements =
    selectedItem?.requirements.filter(
      r => r.assetAddress === game?.classesAddress,
    ) ?? [];
  const options = itemClassRequirements.map(r => r.assetId.toString());
  const { getRootProps, getRadioProps, setValue } = useRadioGroup({
    name: 'class',
    defaultValue: options[0] ?? '0',
    onChange: setClassId,
  });
  const group = getRootProps();

  const resetData = useCallback(() => {
    setValue(options[0] ?? '0');
    setClassId(options[0] ?? '0');
    setIsRemoving(false);
    setTxHash(null);
    setTxFailed(false);
    setIsSyncing(false);
    setIsSynced(false);
  }, [options, setValue]);

  useEffect(() => {
    if (!removeRequirementModal?.isOpen) {
      resetData();
    }
  }, [resetData, removeRequirementModal?.isOpen]);

  const onAddRequirement = useCallback(
    async (e: React.FormEvent<HTMLDivElement>) => {
      e.preventDefault();

      if (!walletClient) throw new Error('Could not find a wallet client');
      if (!game?.itemsAddress) throw new Error('Missing game data');
      if (!character) throw new Error('Character address not found');
      if (!selectedItem) throw new Error('Item not found');

      setIsRemoving(true);

      try {
        const transactionhash = await walletClient.writeContract({
          chain: walletClient.chain,
          account: walletClient.account?.address as Address,
          address: game.itemsAddress as Address,
          abi: parseAbi([
            'function removeItemRequirement(uint256 itemId, address assetAddress, uint256 assetId) external',
          ]),
          functionName: 'removeItemRequirement',
          args: [
            BigInt(selectedItem.itemId),
            game.classesAddress as Address,
            BigInt(classId),
          ],
        });
        setTxHash(transactionhash);

        const client = publicClient ?? walletClient;
        const { blockNumber, status } = await client.waitForTransactionReceipt({
          hash: transactionhash,
        });

        if (status === 'reverted') {
          setTxFailed(true);
          setIsRemoving(false);
          throw new Error('Transaction failed');
        }

        setIsSyncing(true);
        const synced = await waitUntilBlock(blockNumber);
        if (!synced) throw new Error('Something went wrong while syncing');

        setIsSynced(true);
        reloadGame();
      } catch (e) {
        renderError(e, 'Something went wrong while removing requirement');
      } finally {
        setIsSyncing(false);
        setIsRemoving(false);
      }
    },
    [
      character,
      classId,
      game,
      publicClient,
      selectedItem,
      reloadGame,
      renderError,
      walletClient,
    ],
  );

  const isLoading = isRemoving;
  const isDisabled = isLoading;

  const content = () => {
    if (txFailed) {
      return (
        <VStack py={10} spacing={4}>
          <Text>Transaction failed.</Text>
          <Button onClick={removeRequirementModal?.onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

    if (isSynced && selectedItem) {
      return (
        <VStack py={10} spacing={4}>
          <Text>Item requirement has been removed!</Text>
          <Button onClick={removeRequirementModal?.onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

    if (txHash && selectedItem) {
      return (
        <TransactionPending
          isSyncing={isSyncing}
          text={`Removing requirement...`}
          txHash={txHash}
        />
      );
    }

    return (
      <VStack as="form" onSubmit={onAddRequirement} spacing={8}>
        <Flex {...group} wrap="wrap" gap={4}>
          {options.map(value => {
            const radio = getRadioProps({ value });
            const _class = game?.classes.find(c => c.classId === value);
            if (!_class) return null;

            return (
              <RadioCard key={value} {...radio}>
                <VStack justify="space-between" h="100%">
                  <Image
                    alt={`${_class.name} image`}
                    h="70%"
                    objectFit="contain"
                    src={_class.image}
                    w="100%"
                  />
                  <Text textAlign="center">{_class.name}</Text>
                </VStack>
              </RadioCard>
            );
          })}
        </Flex>
        <Button
          autoFocus
          isDisabled={isDisabled}
          isLoading={isLoading}
          loadingText="Removing..."
          type="submit"
        >
          Remove
        </Button>
      </VStack>
    );
  };

  return (
    <Modal
      closeOnEsc={!isLoading}
      closeOnOverlayClick={!isLoading}
      isOpen={removeRequirementModal?.isOpen ?? false}
      onClose={removeRequirementModal?.onClose ?? (() => {})}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Text>Remove Requirement</Text>
          {isSynced && <Text>Success!</Text>}
          <ModalCloseButton size="lg" />
        </ModalHeader>
        <ModalBody>{content()}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
