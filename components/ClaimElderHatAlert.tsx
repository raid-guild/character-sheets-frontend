import { Button, Text } from '@chakra-ui/react';
import { useMemo } from 'react';

import {
  PlayerActions,
  useCharacterActions,
} from '@/contexts/CharacterActionsContext';
import { useClassActions } from '@/contexts/ClassActionsContext';
import { useGame } from '@/contexts/GameContext';
import { RAIDGUILD_GAME_ADDRESS } from '@/utils/constants';

import { Alert } from './Alert';

// TODO: Get this from the elder hat eligibility module
const WARRIOR_CLASS_ID = '0';
const ELDER_HAT_LEVEL = '2';

export const ClaimElderHatAlert: React.FC = () => {
  const { character } = useGame();
  const { openActionModal } = useCharacterActions();
  const { selectClass } = useClassActions();

  const isRaidGuildGame = useMemo(
    () =>
      character?.id.split('-')[0]?.toLowerCase() ===
      RAIDGUILD_GAME_ADDRESS?.toLowerCase(),
    [character],
  );

  const warriorClass = useMemo(
    () => character?.classes.find(cls => cls.classId === WARRIOR_CLASS_ID),
    [character],
  );

  const canClaimElderHat = useMemo(() => {
    if (!warriorClass) return false;
    return (
      Number(warriorClass.level) >= Number(ELDER_HAT_LEVEL) &&
      !warriorClass.isElder
    );
  }, [warriorClass]);

  if (!(isRaidGuildGame && character && warriorClass && canClaimElderHat))
    return null;

  return (
    <Alert>
      <Text>
        You&apos;re Warrior class is at or higher than level {ELDER_HAT_LEVEL}!
        You can now claim a Warrior Elder Hat.
      </Text>
      <Button
        onClick={() => {
          selectClass(warriorClass);
          openActionModal(PlayerActions.CLAIM_ELDER_HAT);
        }}
        size="xs"
        ml={4}
        variant="outline-dark"
      >
        Claim
      </Button>
    </Alert>
  );
};
