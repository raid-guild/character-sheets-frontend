import { Button, Text } from '@chakra-ui/react';
import { useAccount, useSwitchChain } from 'wagmi';

import { Alert } from './Alert';
import { NetworkDisplay } from './NetworkDisplay';

type NetworkAlertProps = {
  chainId: number;
};

export const NetworkAlert: React.FC<NetworkAlertProps> = ({ chainId }) => {
  const { address, chain } = useAccount();
  const { switchChain } = useSwitchChain();

  if (!address || chain?.id === chainId) return null;

  return (
    <Alert>
      <Text>This game is on </Text>
      <NetworkDisplay chainId={chainId} textProps={{ color: 'dark' }} />
      {switchChain ? (
        <Button
          onClick={() => switchChain({ chainId })}
          size="xs"
          ml={4}
          variant="outline-dark"
        >
          Click here to switch your network
        </Button>
      ) : (
        <Text>{'. Please switch your network.'}</Text>
      )}
    </Alert>
  );
};
