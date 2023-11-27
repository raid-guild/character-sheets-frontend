import { Button, Text } from '@chakra-ui/react';

import {
  PlayerActions,
  useCharacterActions,
} from '@/contexts/CharacterActionsContext';
import { useGame } from '@/contexts/GameContext';

import { Alert } from './Alert';

export const OldCharacterURIAlert: React.FC = () => {
  const { character } = useGame();
  const { openActionModal, selectCharacter, uriNeedsUpgraded } =
    useCharacterActions();

  if (!(character && uriNeedsUpgraded)) return null;

  return (
    <Alert>
      <Text>To use the latest features, please upgrade your character URI</Text>
      <Button
        onClick={() => {
          selectCharacter(character);
          openActionModal(PlayerActions.EDIT_CHARACTER);
        }}
        size="xs"
        ml={4}
        variant="outline-dark"
      >
        Upgrade
      </Button>
    </Alert>
  );
};
