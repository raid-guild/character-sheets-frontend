import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  HStack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useAccount, useChainId, useSwitchNetwork } from 'wagmi';

import { NetworkDisplay } from './NetworkDisplay';

type NetworkAlertProps = {
  chainId: number;
};

export const NetworkAlert: React.FC<NetworkAlertProps> = ({ chainId }) => {
  const connectedChainId = useChainId();
  const { address } = useAccount();
  const { switchNetwork } = useSwitchNetwork();

  if (!address || connectedChainId === chainId) return null;

  return (
    <VStack align="center" w="100%" mb={8}>
      <Alert status="warning" w="auto" borderRadius="0">
        <AlertIcon />
        <AlertDescription color="dark">
          <HStack>
            <Text>This game is on </Text>
            <NetworkDisplay chainId={chainId} textProps={{ color: 'dark' }} />
            {switchNetwork ? (
              <Button
                onClick={() => switchNetwork(chainId)}
                size="xs"
                color="dark"
                ml={4}
                borderColor="dark"
                _hover={{ bg: 'dark', color: 'white' }}
              >
                Click here to switch your network
              </Button>
            ) : (
              <Text>{'. Please switch your network.'}</Text>
            )}
          </HStack>
        </AlertDescription>
      </Alert>
    </VStack>
  );
};
