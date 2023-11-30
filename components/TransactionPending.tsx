import { Link, Spinner, Text, VStack } from '@chakra-ui/react';
import { useChainId } from 'wagmi';

import { getTxUrl } from '@/lib/web3';

type TransactionPendingProps = {
  isSyncing: boolean;
  text: string;
  txHash: string;
  chainId?: number | undefined;
};

export const TransactionPending: React.FC<TransactionPendingProps> = ({
  isSyncing,
  text,
  txHash,
  chainId,
}) => {
  const currentChainId = useChainId();
  return (
    <VStack spacing={10}>
      <Text>{text}</Text>
      <Text>
        Click{' '}
        <Link
          borderBottom="2px solid black"
          href={getTxUrl(chainId ?? currentChainId, txHash)}
          isExternal
        >
          here
        </Link>{' '}
        to view your transaction.
      </Text>
      <Spinner size="xl" />
      <Text>
        {isSyncing ? `Subgraph is syncing...` : `Transaction is pending...`}
      </Text>
    </VStack>
  );
};
