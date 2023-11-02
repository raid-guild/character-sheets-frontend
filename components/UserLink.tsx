import { HStack, Link, Text } from '@chakra-ui/react';
import { Address, useAccount } from 'wagmi';

import { useEnsName } from '@/hooks/useEnsName';
import { DEFAULT_CHAIN } from '@/lib/web3';
import { EXPLORER_URLS } from '@/utils/constants';
import { shortenAddress } from '@/utils/helpers';

export const UserLink: React.FC<{ user: string }> = ({ user }) => {
  const { ensName } = useEnsName(user as Address);
  const { address } = useAccount();
  const isCurrentUser = address?.toLowerCase() === user.toLowerCase();

  return (
    <Link
      fontSize="sm"
      href={`${EXPLORER_URLS[DEFAULT_CHAIN.id]}/address/${user}`}
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
