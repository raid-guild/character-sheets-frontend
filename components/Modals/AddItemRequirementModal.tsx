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
  useToast,
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

export const AddItemRequirementModal: React.FC = () => {
  const { character, game, reload: reloadGame } = useGame();
  const { selectedItem, addRequirementModal } = useItemActions();

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const toast = useToast();

  const [classId, setClassId] = useState<string>('1');

  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSynced, setIsSynced] = useState<boolean>(false);

  // TODO: For now we are only adding class requirements
  const allGameClasses = game?.classes.map(c => c.classId) ?? [];
  const itemClassRequirements =
    selectedItem?.requirements.filter(
      r => r.assetAddress === game?.classesAddress,
    ) ?? [];
  const itemClassRequirementIds = itemClassRequirements.map(r =>
    r.assetId.toString(),
  );
  const options = allGameClasses.filter(
    c => !itemClassRequirementIds.includes(c),
  ); // Filter out the classes that are already requirements for this item
  const { getRootProps, getRadioProps, setValue } = useRadioGroup({
    name: 'class',
    defaultValue: options[0] ?? '0',
    onChange: setClassId,
  });
  const group = getRootProps();

  const resetData = useCallback(() => {
    setValue(options[0] ?? '0');
    setClassId(options[0] ?? '0');
    setIsAdding(false);
    setTxHash(null);
    setIsSyncing(false);
    setIsSynced(false);
  }, [options, setValue]);

  useEffect(() => {
    if (!addRequirementModal?.isOpen) {
      resetData();
    }
  }, [resetData, addRequirementModal?.isOpen]);

  const onAddRequirement = useCallback(
    async (e: React.FormEvent<HTMLDivElement>) => {
      e.preventDefault();

      if (!walletClient) {
        toast({
          description: 'Wallet client is not connected.',
          position: 'top',
          status: 'error',
        });
        console.error('Could not find a wallet client.');
        return;
      }

      if (!game?.itemsAddress) {
        toast({
          description: `Could not find the game.`,
          position: 'top',
          status: 'error',
        });
        console.error(`Missing game data.`);
        return;
      }

      if (!character) {
        toast({
          description: 'Character address not found.',
          position: 'top',
          status: 'error',
        });
        console.error('Character address not found.');
        return;
      }

      if (!selectedItem) {
        toast({
          description: 'Item not found.',
          position: 'top',
          status: 'error',
        });
        console.error('Item not found.');
        return;
      }

      setIsAdding(true);

      try {
        const transactionhash = await walletClient.writeContract({
          chain: walletClient.chain,
          account: walletClient.account?.address as Address,
          address: game.itemsAddress as Address,
          abi: parseAbi([
            'function addItemRequirement(uint256 itemId, uint8 category, address assetAddress, uint256 assetId, uint256 amount) external',
          ]),
          functionName: 'addItemRequirement',
          args: [
            BigInt(selectedItem.itemId),
            2,
            game.classesAddress as Address, // TODO: Add amount as a parameter; also add item requirements
            BigInt(classId),
            BigInt(1),
          ],
        });
        setTxHash(transactionhash);

        const client = publicClient ?? walletClient;
        const receipt = await client.waitForTransactionReceipt({
          hash: transactionhash,
        });

        setIsSyncing(true);
        const synced = await waitUntilBlock(receipt.blockNumber);

        if (!synced) {
          toast({
            description: 'Something went wrong while syncing.',
            position: 'top',
            status: 'warning',
          });
          return;
        }
        setIsSynced(true);
        reloadGame();
      } catch (e) {
        toast({
          description: `Something went wrong while adding requirement.`,
          position: 'top',
          status: 'error',
        });
        console.error(e);
      } finally {
        setIsSyncing(false);
        setIsAdding(false);
      }
    },
    [
      character,
      classId,
      game,
      publicClient,
      selectedItem,
      reloadGame,
      toast,
      walletClient,
    ],
  );

  const isLoading = isAdding;
  const isDisabled = isLoading;

  const content = () => {
    if (isSynced && selectedItem) {
      return (
        <VStack py={10} spacing={4}>
          <Text>Item requirement has been added!</Text>
          <Button onClick={addRequirementModal?.onClose} variant="outline">
            Close
          </Button>
        </VStack>
      );
    }

    if (txHash && selectedItem) {
      return (
        <TransactionPending
          isSyncing={isSyncing}
          text={`Adding requirement...`}
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
          loadingText="Adding..."
          type="submit"
        >
          Add
        </Button>
      </VStack>
    );
  };

  return (
    <Modal
      closeOnEsc={!isLoading}
      closeOnOverlayClick={!isLoading}
      isOpen={addRequirementModal?.isOpen ?? false}
      onClose={addRequirementModal?.onClose ?? (() => {})}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Text>Add Requirement</Text>
          {isSynced && <Text>Success!</Text>}
          <ModalCloseButton size="lg" />
        </ModalHeader>
        <ModalBody>{content()}</ModalBody>
      </ModalContent>
    </Modal>
  );
};
