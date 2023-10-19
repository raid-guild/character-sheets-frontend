import {
  Button,
  SimpleGrid,
  Text,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { PropsWithChildren } from 'react';
import { useChainId } from 'wagmi';

import { useGame } from '@/contexts/GameContext';

import { SmallItemCard } from './ItemCard';
import { CreateItemModal } from './Modals/CreateItemModal';

export const ItemsPanel: React.FC<PropsWithChildren> = () => {
  const createItemModal = useDisclosure();
  const { game, isMaster } = useGame();
  const chainId = useChainId();

  return (
    <VStack pt={10} pb={20} spacing={10} w="100%">
      {isMaster && (
        <Button onClick={createItemModal.onOpen}>Create an Item</Button>
      )}
      {(!game || game.items.length === 0) && (
        <VStack>
          <Text align="center">No items found.</Text>
        </VStack>
      )}
      {game && game.items.length > 0 && (
        <>
          <SimpleGrid columns={2} spacing={4} w="100%">
            {game.items.map(c => (
              <SmallItemCard key={c.id} {...c} chainId={chainId} />
            ))}
          </SimpleGrid>
        </>
      )}
      <CreateItemModal {...createItemModal} />
    </VStack>
  );
};
