import {
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  useToast,
} from '@chakra-ui/react';

import { useGame } from '@/contexts/GameContext';
import { Class } from '@/utils/types';

type ActionMenuProps = {
  variant?: 'outline' | 'solid' | 'ghost';
} & Class;

export const ClassActionMenu: React.FC<ActionMenuProps> = ({
  variant = 'outline',
}) => {
  const toast = useToast();
  const { isMaster } = useGame();

  return (
    <Menu>
      <MenuButton as={Button} size="sm" variant={variant} w="100%">
        Actions
      </MenuButton>
      <MenuList>
        <Text
          borderBottom="1px solid black"
          fontSize="12px"
          fontWeight="bold"
          p={3}
          textAlign="center"
        >
          Player Actions
        </Text>
        {/* TODO: Check if held by character */}
        <MenuItem
          onClick={() => {
            toast({
              title: 'Coming soon!',
              position: 'top',
              status: 'warning',
            });
          }}
        >
          Claim
        </MenuItem>
        {isMaster && (
          <>
            <Text
              borderBottom="1px solid black"
              borderTop="3px solid black"
              fontSize="12px"
              fontWeight="bold"
              p={3}
              textAlign="center"
            >
              GameMaster Actions
            </Text>
            <MenuItem
              onClick={() => {
                toast({
                  title: 'Coming soon!',
                  position: 'top',
                  status: 'warning',
                });
              }}
            >
              Edit Class
            </MenuItem>
            <MenuItem
              onClick={() => {
                toast({
                  title: 'Coming soon!',
                  position: 'top',
                  status: 'warning',
                });
              }}
            >
              Assign Class
            </MenuItem>
          </>
        )}
      </MenuList>
    </Menu>
  );
};
