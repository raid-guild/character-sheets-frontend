import { Button, Text } from '@chakra-ui/react';
import { useMemo } from 'react';
import { useNetwork } from 'wagmi';

import {
  PlayerActions,
  useCharacterActions,
} from '@/contexts/CharacterActionsContext';
import { useGame } from '@/contexts/GameContext';
import { getChainLabelFromId } from '@/lib/web3';
import { BASE_CHARACTER_URI } from '@/utils/constants';

import { Alert } from './Alert';

export const OldCharacterURIAlert: React.FC = () => {
  const { character } = useGame();
  const { chain } = useNetwork();
  const { openActionModal, selectCharacter } = useCharacterActions();

  const uriNeedsUpgraded = useMemo(() => {
    if (!(chain && character)) return false;
    const chainLabel = getChainLabelFromId(chain.id);
    const { uri } = character;
    const potentialCID = uri
      .split('/')
      .filter(s => !!s)
      .pop();

    if (!(chainLabel && potentialCID)) return false;

    const baseURI = uri.replace(potentialCID, '');
    if (baseURI !== `${BASE_CHARACTER_URI}${chainLabel}/`) return false;

    return potentialCID.match(/^[a-zA-Z0-9]{46,59}$/);
  }, [chain, character]);

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
