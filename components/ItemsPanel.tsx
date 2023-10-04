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
import {
  ItemActionsProvider,
  useItemActions,
} from '@/contexts/ItemActionsContext';

import { SmallItemCard } from './ItemCard';
import { ClaimItemModal } from './Modals/ClaimItemModal';
import { CreateItemModal } from './Modals/CreateItemModal';

export const ItemsPanel: React.FC<PropsWithChildren> = () => {
  const createItemModal = useDisclosure();

  const { isMaster } = useGame();

  return (
    <ItemActionsProvider>
      <VStack pt={10} pb={20} spacing={10} w="100%">
        {isMaster && (
          <Button onClick={createItemModal.onOpen}>Create an Item</Button>
        )}
        <ItemsPanelInner />
        <CreateItemModal {...createItemModal} />
      </VStack>
    </ItemActionsProvider>
  );
};

const ItemsPanelInner: React.FC = () => {
  const { game } = useGame();
  const chainId = useChainId();
  const { claimItemModal } = useItemActions();

  if (!game || game.items.length === 0) {
    return (
      <VStack>
        <Text align="center">No items found.</Text>
      </VStack>
    );
  }

  return (
    <>
      <SimpleGrid columns={2} spacing={4} w="100%">
        {game.items.map(c => (
          <SmallItemCard key={c.id} {...c} chainId={chainId} />
        ))}
      </SimpleGrid>
      {claimItemModal && <ClaimItemModal />}
    </>
  );
};
