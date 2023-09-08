import {
  Button,
  SimpleGrid,
  Text,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { useChainId } from 'wagmi';

import { useGame } from '@/contexts/GameContext';

import { SmallItemCard } from './ItemCard';
import { CreateItemModal } from './Modals/CreateItemModal';

export const ItemsPanel: React.FC = () => {
  const createItemModal = useDisclosure();

  const { game, isMaster } = useGame();
  const chainId = useChainId();

  function content() {
    if (!game || game.items.length === 0) {
      return (
        <VStack as="main">
          <Text align="center">No items found.</Text>
        </VStack>
      );
    }

    return (
      <SimpleGrid columns={2} spacing={4} w="100%">
        {game.items.map(c => (
          <SmallItemCard
            key={c.id}
            {...c}
            chainId={chainId}
            isMaster={isMaster}
          />
        ))}
      </SimpleGrid>
    );
  }
  return (
    <VStack as="main" pt={10} pb={20} spacing={10}>
      {isMaster && (
        <Button onClick={createItemModal.onOpen}>Create an Item</Button>
      )}
      <>{content()}</>
      <CreateItemModal {...createItemModal} />
    </VStack>
  );
};
