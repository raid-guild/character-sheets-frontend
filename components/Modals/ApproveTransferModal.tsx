import { Button, Link, Text, VStack } from '@chakra-ui/react';
import { useCallback, useMemo, useState } from 'react';
import { parseAbi } from 'viem';
import { Address, useWalletClient } from 'wagmi';

import { useCharacterActions } from '@/contexts/CharacterActionsContext';
import { useGame } from '@/contexts/GameContext';
import { getAddressUrl } from '@/lib/web3';
import { shortenAddress } from '@/utils/helpers';

import { ActionModal } from './ActionModal';

export const ApproveTransferModal: React.FC = () => {
  const { game, reload: reloadGame } = useGame();
  const { selectedCharacter, approveTransferModal } = useCharacterActions();

  const { data: walletClient } = useWalletClient();

  const [isApproving, setIsApproving] = useState<boolean>(false);

  const resetData = useCallback(() => {
    setIsApproving(false);
  }, []);

  const gameOwner = useMemo(() => {
    if (!game) return null;
    return game.owner as Address;
  }, [game]);

  const onApproveTransfer = useCallback(async () => {
    try {
      if (!walletClient) throw new Error('Could not find a wallet client');
      if (!game) throw new Error('Missing game data');
      if (!selectedCharacter) throw new Error('Character not found');

      if (!gameOwner) throw new Error('Game owner not found');

      setIsApproving(true);

      const transactionhash = await walletClient.writeContract({
        chain: walletClient.chain,
        account: walletClient.account?.address as Address,
        address: game.id as Address,
        abi: parseAbi([
          'function approve(address to, uint256 characterId) public',
        ]),
        functionName: 'approve',
        args: [gameOwner, BigInt(selectedCharacter.characterId)],
      });

      return transactionhash;
    } catch (e) {
      throw e;
    } finally {
      setIsApproving(false);
    }
  }, [game, gameOwner, selectedCharacter, walletClient]);

  const isLoading = isApproving;
  const isDisabled = isLoading;

  return (
    <ActionModal
      {...{
        isOpen: approveTransferModal?.isOpen,
        onClose: approveTransferModal?.onClose,
        header: 'Approve Character Transfer',
        loadingText: `Approving character transfer...`,
        successText: 'Your character has been approved for transfer!',
        errorText: 'There was an error approving the character transfer.',
        resetData,
        onAction: onApproveTransfer,
        onComplete: reloadGame,
      }}
    >
      <VStack spacing={8}>
        <Text textAlign="center">
          By clicking approve, you are allowing the game owner (
          <Link
            alignItems="center"
            fontSize="sm"
            href={
              game && gameOwner ? getAddressUrl(game.chainId, gameOwner) : ''
            }
            isExternal
            textDecor="underline"
          >
            {gameOwner ? shortenAddress(gameOwner) : ''}
          </Link>
          ) to transfer your character to another player address.
        </Text>
        <Button
          autoFocus
          isDisabled={isDisabled}
          isLoading={isLoading}
          loadingText="Approving..."
          type="submit"
          variant="solid"
          alignSelf="flex-end"
        >
          Approve
        </Button>
      </VStack>
    </ActionModal>
  );
};
