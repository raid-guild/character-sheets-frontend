import {
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
} from '@chakra-ui/react';

import { PlayerActions, useActions } from '@/contexts/ActionsContext';
import { Character } from '@/utils/types';

type CharacterActionMenuProps = {
  character: Character;
};

export const CharacterActionMenu: React.FC<CharacterActionMenuProps> = ({
  character,
}) => {
  const { selectCharacter, playerActions, gmActions, openActionModal } =
    useActions();

  return (
    <>
      <Menu onOpen={() => selectCharacter(character)}>
        <MenuButton as={Button} size="sm" w="100%">
          Actions
        </MenuButton>
        <MenuList>
          {playerActions.length > 0 && (
            <>
              <Text
                borderBottom="1px solid black"
                fontSize="12px"
                fontWeight="bold"
                p={3}
                textAlign="center"
              >
                Player Actions
              </Text>
              {playerActions
                .filter(a => a != PlayerActions.EQUIP_ITEM)
                .map(action => (
                  <MenuItem
                    key={action}
                    onClick={() => openActionModal(action)}
                  >
                    {action}
                  </MenuItem>
                ))}
            </>
          )}
          {gmActions.length > 0 && (
            <>
              <Text
                borderBottom="1px solid black"
                borderTop={
                  playerActions.length > 0 ? '3px solid black' : 'none'
                }
                fontSize="12px"
                fontWeight="bold"
                p={3}
                textAlign="center"
              >
                GameMaster Actions
              </Text>
              {gmActions.map(action => (
                <MenuItem key={action} onClick={() => openActionModal(action)}>
                  {action}
                </MenuItem>
              ))}
            </>
          )}
        </MenuList>
      </Menu>
    </>
  );
};
