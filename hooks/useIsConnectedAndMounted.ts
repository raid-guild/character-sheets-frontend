import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

export const useIsConnectedAndMounted = (): boolean => {
  const { isConnected } = useAccount();
  const [isConnectedAndMounted, setIsConnectedAndMounted] = useState(false);

  useEffect(() => {
    setIsConnectedAndMounted(isConnected);
  }, [isConnected]);

  return isConnectedAndMounted;
};
