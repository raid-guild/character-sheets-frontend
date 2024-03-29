import {
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
} from '@chakra-ui/react';

import { useCharacterActions } from '@/contexts/CharacterActionsContext';
import { useClassActions } from '@/contexts/ClassActionsContext';
import { Class } from '@/utils/types';

type ActionMenuProps = {
  classEntity: Class;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'outline' | 'solid' | 'ghost';
};

export const ClassActionMenu: React.FC<ActionMenuProps> = ({
  classEntity,
  size = 'sm',
  variant = 'outline',
}) => {
  const { selectCharacter } = useCharacterActions();
  const { gmActions, openActionModal, playerActions, selectClass } =
    useClassActions();

  return (
    <Menu
      onOpen={() => {
        selectCharacter(null);
        selectClass(classEntity);
      }}
    >
      <MenuButton as={Button} size={size} variant={variant} w="100%">
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
              variant="heading"
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
              borderTop={playerActions.length > 0 ? '3px solid black' : 'none'}
              fontSize="12px"
              fontWeight="bold"
              p={3}
              textAlign="center"
              variant="heading"
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
        {gmActions.length === 0 && playerActions.length === 0 && (
          <Text
            fontSize="12px"
            fontWeight="bold"
            p={3}
            textAlign="center"
            variant="heading"
          >
            No actions available
          </Text>
        )}
      </MenuList>
    </Menu>
  );
};
