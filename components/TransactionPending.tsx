import { Link, Spinner, Text, VStack } from '@chakra-ui/react';

import { DEFAULT_CHAIN } from '@/lib/web3';
import { EXPLORER_URLS } from '@/utils/constants';

type TransactionPendingProps = {
  isSyncing: boolean;
  text: string;
  txHash: string;
};

export const TransactionPending: React.FC<TransactionPendingProps> = ({
  isSyncing,
  text,
  txHash,
}) => {
  return (
    <VStack spacing={10}>
      <Text>{text}</Text>
      {EXPLORER_URLS[DEFAULT_CHAIN.id] && (
        <Text>
          Click{' '}
          <Link
            borderBottom="2px solid black"
            href={`${EXPLORER_URLS[DEFAULT_CHAIN.id]}/tx/${txHash}`}
            isExternal
          >
            here
          </Link>{' '}
          to view your transaction.
        </Text>
      )}
      <Spinner size="xl" />
      <Text>
        {isSyncing ? `Subgraph is syncing...` : `Transaction is pending...`}
      </Text>
    </VStack>
  );
};
