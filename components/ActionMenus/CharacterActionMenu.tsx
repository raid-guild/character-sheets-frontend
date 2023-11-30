import {
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
} from '@chakra-ui/react';

import { useCharacterActions } from '@/contexts/CharacterActionsContext';
import { Character } from '@/utils/types';

type CharacterActionMenuProps = {
  character: Character;
  variant?: 'outline' | 'solid' | 'ghost';
};

export const CharacterActionMenu: React.FC<CharacterActionMenuProps> = ({
  character,
  variant = 'outline',
}) => {
  const { selectCharacter, playerActions, gmActions, openActionModal } =
    useCharacterActions();

  return (
    <>
      <Menu onOpen={() => selectCharacter(character)}>
        <MenuButton as={Button} size="sm" variant={variant} w="100%">
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
              {playerActions.map(action => (
                <MenuItem key={action} onClick={() => openActionModal(action)}>
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
