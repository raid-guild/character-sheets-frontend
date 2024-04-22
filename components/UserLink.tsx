import { HStack, Link, Text } from '@chakra-ui/react';
import { Address } from 'viem';
import { useAccount } from 'wagmi';

import { useGame } from '@/contexts/GameContext';
import { useEnsName } from '@/hooks/useEnsName';
import { useIsConnectedAndMounted } from '@/hooks/useIsConnectedAndMounted';
import { getAddressUrl } from '@/lib/web3';
import { shortenAddress } from '@/utils/helpers';

export const UserLink: React.FC<{ user: string }> = ({ user }) => {
  const { ensName } = useEnsName(user as Address);
  const { game } = useGame();
  const { address } = useAccount();
  const isCurrentUser = address?.toLowerCase() === user.toLowerCase();

  const isConnectedAndMounted = useIsConnectedAndMounted();

  if (!game) return null;

  return (
    <Link
      fontSize="sm"
      href={getAddressUrl(game.chainId, user)}
      isExternal
      bg={isCurrentUser ? 'whiteAlpha.300' : ''}
      textDecor={!isCurrentUser ? 'underline' : ''}
      _hover={{
        color: 'accent',
      }}
    >
      {isConnectedAndMounted && isCurrentUser ? (
        <HStack px={1} spacing={3}>
          <Text as="span">You</Text>
          <Text as="span" textDecor="underline">
            ({ensName || shortenAddress(user)})
          </Text>
        </HStack>
      ) : (
        ensName || shortenAddress(user)
      )}
    </Link>
  );
};
