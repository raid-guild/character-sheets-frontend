import { HStack, Link, Text } from '@chakra-ui/react';
import { Address, useAccount, useChainId } from 'wagmi';

import { useEnsName } from '@/hooks/useEnsName';
import { getAddressUrl } from '@/lib/web3';
import { shortenAddress } from '@/utils/helpers';

export const UserLink: React.FC<{ user: string }> = ({ user }) => {
  const { ensName } = useEnsName(user as Address);
  const { address } = useAccount();
  const chainId = useChainId();
  const isCurrentUser = address?.toLowerCase() === user.toLowerCase();

  return (
    <Link
      fontSize="sm"
      href={getAddressUrl(chainId, user)}
      isExternal
      bg={isCurrentUser ? 'whiteAlpha.300' : ''}
      textDecor={!isCurrentUser ? 'underline' : ''}
      _hover={{
        color: 'accent',
      }}
    >
      {isCurrentUser ? (
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
