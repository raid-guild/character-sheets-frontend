import { Button, StackProps, useDisclosure, VStack } from '@chakra-ui/react';

import { ItemsCatalogModal } from '@/components/Modals/ItemsCatalogModal';
import {
  GameMasterActions,
  useGameActions,
} from '@/contexts/GameActionsContext';
import { useGame } from '@/contexts/GameContext';

import { ClassesModal } from './Modals/ClassesModal';

export const GameActions: React.FC<StackProps> = ({ ...props }) => {
  const { isMaster } = useGame();

  const { openActionModal } = useGameActions();
  const itemsCatalogModal = useDisclosure();
  const classesModal = useDisclosure();

  return (
    <VStack
      h="100%"
      bg="cardBG"
      px={{ base: 4, sm: 8 }}
      py={8}
      align="stretch"
      spacing={4}
      {...props}
    >
      <Button onClick={itemsCatalogModal.onOpen} size="sm">
        show items catalog
      </Button>
      <Button onClick={classesModal.onOpen} size="sm">
        show all classes
      </Button>
      {isMaster && (
        <>
          <Button
            onClick={() => openActionModal(GameMasterActions.CREATE_ITEM)}
            size="sm"
          >
            create Item
          </Button>
          <Button
            onClick={() => openActionModal(GameMasterActions.CREATE_CLASS)}
            size="sm"
          >
            create Class
          </Button>
        </>
      )}
      <ItemsCatalogModal
        isOpen={itemsCatalogModal.isOpen}
        onClose={itemsCatalogModal.onClose}
      />
      <ClassesModal
        isOpen={classesModal.isOpen}
        onClose={classesModal.onClose}
      />
    </VStack>
  );
};
