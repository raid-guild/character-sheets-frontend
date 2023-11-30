import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

export const useIsConnectedAndMounted = () => {
  const { isConnected } = useAccount();
  const [isConnectedAndMounted, setIsConnectedAndMounted] = useState(false);

  useEffect(() => {
    setIsConnectedAndMounted(isConnected);
  }, [isConnected]);

  return isConnectedAndMounted;
};
