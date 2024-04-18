import { Button, Text, VStack } from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';
import { getAddress, isAddress, parseAbi } from 'viem';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';

import { useGame } from '@/contexts/GameContext';
import { useGlobalForChain } from '@/hooks/useGlobal';
import { useToast } from '@/hooks/useToast';
import { READ_CLIENTS } from '@/lib/web3';

import { Alert } from './Alert';

const fetchImplementionFromProxy = async (
  chainId: number,
  proxyAddress: string,
): Promise<string | null> => {
  if (!isAddress(proxyAddress)) return null;
  const readClient = READ_CLIENTS[chainId];
  const storagePosition =
    '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
  const implementation = await readClient.getStorageAt({
    address: proxyAddress,
    slot: storagePosition,
  });
  if (!implementation) return null;
  const implAddress = `0x${implementation.slice(26)}`;
  if (!isAddress(implAddress)) return null;
  return implAddress.toLowerCase();
};

export const ImplementationsAlert: React.FC = () => {
  const { game, reload } = useGame();
  const { address } = useAccount();
  const { data } = useGlobalForChain(game?.chainId);
  const [contractNeedsUpgrade, setContractNeedsUpgrade] = useState<{
    characterSheets: boolean;
    items: boolean;
    itemsManager: boolean;
    classes: boolean;
    hatsAdaptor: boolean;
    experience: boolean;
  }>({
    characterSheets: false,
    items: false,
    itemsManager: false,
    classes: false,
    hatsAdaptor: false,
    experience: false,
  });

  const someContractNeedsUpgrade = Object.values(contractNeedsUpgrade).some(
    value => value,
  );
  const isOwner = address?.toLowerCase() === game?.owner.toLowerCase();

  useEffect(() => {
    if (!game || !data?.implementations) return;

    (async () => {
      const {
        id,
        itemsAddress,
        classesAddress,
        hatsAdaptor,
        itemsManager,
        experienceAddress,
      } = game;

      const [
        characterSheetsImplementation,
        itemsImplementation,
        classesImplementation,
        hatsAdaptorImplementation,
        itemsManagerImplementation,
        experienceImplementation,
      ] = await Promise.all([
        fetchImplementionFromProxy(game.chainId, id),
        fetchImplementionFromProxy(game.chainId, itemsAddress),
        fetchImplementionFromProxy(game.chainId, classesAddress),
        fetchImplementionFromProxy(game.chainId, hatsAdaptor),
        fetchImplementionFromProxy(game.chainId, itemsManager),
        fetchImplementionFromProxy(game.chainId, experienceAddress),
      ]);

      const contractNeedsUpgrade = {
        characterSheets:
          characterSheetsImplementation !==
          data.implementations.characterSheetsImplementation,
        items: itemsImplementation !== data.implementations.itemsImplementation,
        itemsManager:
          itemsManagerImplementation !==
          data.implementations.itemsManagerImplementation,
        classes:
          classesImplementation !== data.implementations.classesImplementation,
        hatsAdaptor:
          hatsAdaptorImplementation !==
          data.implementations.hatsAdaptorImplementation,
        experience:
          experienceImplementation !==
          data.implementations.experienceImplementation,
      };

      setContractNeedsUpgrade(contractNeedsUpgrade);
    })();
  }, [game, data]);

  if (!game || !data?.implementations || !someContractNeedsUpgrade || !isOwner)
    return null;

  return (
    <Alert
      footer={
        <VStack>
          {contractNeedsUpgrade.characterSheets && (
            <UpgradeButton
              contractName="Game"
              proxyAddress={game.id}
              implementationAddress={
                data.implementations.characterSheetsImplementation
              }
              reloadGame={reload}
            />
          )}
          {contractNeedsUpgrade.experience && (
            <UpgradeButton
              contractName="Experience"
              proxyAddress={game.experienceAddress}
              implementationAddress={
                data.implementations.experienceImplementation
              }
              reloadGame={reload}
            />
          )}
          {contractNeedsUpgrade.items && (
            <UpgradeButton
              contractName="Items"
              proxyAddress={game.itemsAddress}
              implementationAddress={data.implementations.itemsImplementation}
              reloadGame={reload}
            />
          )}
          {contractNeedsUpgrade.itemsManager && (
            <UpgradeButton
              contractName="Items Manager"
              proxyAddress={game.itemsManager}
              implementationAddress={
                data.implementations.itemsManagerImplementation
              }
              reloadGame={reload}
            />
          )}
          {contractNeedsUpgrade.classes && (
            <UpgradeButton
              contractName="Classes"
              proxyAddress={game.classesAddress}
              implementationAddress={data.implementations.classesImplementation}
              reloadGame={reload}
            />
          )}
          {contractNeedsUpgrade.hatsAdaptor && (
            <UpgradeButton
              contractName="Hats Adaptor"
              proxyAddress={game.hatsAdaptor}
              implementationAddress={
                data.implementations.hatsAdaptorImplementation
              }
              reloadGame={reload}
            />
          )}
        </VStack>
      }
    >
      <Text>To use the latest features, please upgrade the game contracts</Text>
    </Alert>
  );
};

const UpgradeButton: React.FC<{
  contractName: string;
  proxyAddress: string;
  implementationAddress: string;
  reloadGame: () => void;
}> = ({ contractName, proxyAddress, implementationAddress, reloadGame }) => {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const { renderError, renderSuccess } = useToast();

  const upgradeContract = useCallback(async () => {
    try {
      if (!walletClient?.account)
        throw new Error('Could not find a wallet client');

      if (!publicClient) throw new Error('Could not find a public client');

      setIsUpgrading(true);

      const transactionhash = await walletClient.writeContract({
        chain: walletClient.chain,
        account: walletClient.account.address,
        address: getAddress(proxyAddress),
        abi: parseAbi([
          'function upgradeToAndCall(address newImplementation, bytes memory data) public payable',
        ]),
        functionName: 'upgradeToAndCall',
        args: [getAddress(implementationAddress), '0x'],
      });

      await publicClient.waitForTransactionReceipt({
        hash: transactionhash,
      });

      reloadGame();
      renderSuccess(`${contractName} contract upgraded successfully`);
    } catch (error) {
      renderError(
        error,
        `Something went wrong while upgrading the ${contractName} contract`,
      );
    } finally {
      setIsUpgrading(false);
    }
  }, [
    walletClient,
    publicClient,
    proxyAddress,
    implementationAddress,
    reloadGame,
    renderError,
    renderSuccess,
    contractName,
  ]);

  return (
    <Button
      onClick={upgradeContract}
      size="xs"
      ml={4}
      variant="outline-dark"
      isLoading={isUpgrading}
      _loading={{ color: 'black', opacity: 1 }}
    >
      Upgrade {contractName} Contract
    </Button>
  );
};
