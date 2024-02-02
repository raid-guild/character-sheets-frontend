import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';
import { Hex } from 'viem';
import { usePublicClient, useWalletClient } from 'wagmi';

import { TransactionPending } from '@/components/TransactionPending';
import { waitUntilBlock } from '@/graphql/health';
import { useToast } from '@/hooks/useToast';

export type ActionModalProps = {
  isOpen: boolean | undefined;
  onClose: (() => void) | undefined;
  onAction: () => Promise<Hex | null>;
  onComplete?: (() => void) | undefined;
  header: string;
  loadingText: string;
  successText: string;
  failureText?: string;
  errorText?: string;
  resetData: () => void;
  chainId: number | undefined;
};

export const ActionModal: React.FC<
  React.PropsWithChildren<ActionModalProps>
> = ({
  isOpen,
  onClose,
  header,
  children,
  loadingText,
  successText,
  failureText = 'Transaction failed',
  errorText = 'Something went wrong',
  resetData,
  chainId,
  onAction,
  onComplete,
}) => {
  const { renderError } = useToast();

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txFailed, setTxFailed] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSynced, setIsSynced] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      resetData();

      setIsLoading(false);
      setTxHash(null);
      setTxFailed(false);
      setIsSyncing(false);
      setIsSynced(false);
    }
  }, [resetData, isOpen]);

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLDivElement>) => {
      e.preventDefault();
      try {
        setIsLoading(true);
        const txHash = await onAction();
        if (!txHash) return;
        setTxHash(txHash);

        const client = publicClient ?? walletClient;
        const { blockNumber, status } = await client.waitForTransactionReceipt({
          hash: txHash,
        });

        if (status === 'reverted') {
          setTxFailed(true);
          setIsLoading(false);
          throw new Error('Transaction failed');
        }

        setIsSyncing(true);
        const synced = await waitUntilBlock(client.chain.id, blockNumber);
        if (!synced) throw new Error('Something went wrong while syncing');

        setIsSynced(true);

        onComplete?.();
      } catch (error) {
        renderError(e, errorText);
      } finally {
        setIsSyncing(false);
        setIsLoading(false);
      }
    },
    [onAction, onComplete, renderError, publicClient, walletClient, errorText],
  );

  return (
    <Modal
      closeOnEsc={!isLoading}
      closeOnOverlayClick={!isLoading}
      isOpen={isOpen ?? false}
      onClose={onClose ?? (() => {})}
    >
      <ModalOverlay />
      <ModalContent mt={{ base: 0, md: '84px' }}>
        <ModalHeader>
          <Text>{header}</Text>
          <ModalCloseButton size="lg" />
        </ModalHeader>
        <ModalBody>
          {
            <>
              {txFailed ? (
                <VStack py={10} spacing={4}>
                  <Text>{failureText}</Text>
                  <Button onClick={onClose} variant="outline">
                    Close
                  </Button>
                </VStack>
              ) : isSynced ? (
                <VStack py={10} spacing={4}>
                  <Text>{successText}</Text>
                  <Button onClick={onClose} variant="outline">
                    Close
                  </Button>
                </VStack>
              ) : txHash ? (
                <TransactionPending
                  isSyncing={isSyncing}
                  text={loadingText}
                  txHash={txHash}
                  chainId={chainId}
                />
              ) : (
                <VStack as="form" onSubmit={onSubmit} spacing={8}>
                  {children}
                </VStack>
              )}
            </>
          }
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
