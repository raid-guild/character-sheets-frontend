import { Button, Text } from '@chakra-ui/react';
import { useMemo } from 'react';

import {
  PlayerActions,
  useCharacterActions,
} from '@/contexts/CharacterActionsContext';
import { useGame } from '@/contexts/GameContext';

import { Alert } from './Alert';

export const OldCharacterURIAlert: React.FC = () => {
  const { character } = useGame();
  const { openActionModal, selectCharacter } = useCharacterActions();

  const isCIDBasedURI = useMemo(() => {
    if (!character) return false;
    const { uri } = character;
    const potentialCID = uri
      .split('/')
      .filter(s => !!s)
      .pop();

    if (!potentialCID) return false;

    return potentialCID.match(/^[a-zA-Z0-9]{46,59}$/);
  }, [character]);

  if (!(character && isCIDBasedURI)) return null;

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
