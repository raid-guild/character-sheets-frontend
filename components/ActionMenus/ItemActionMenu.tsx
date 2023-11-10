import {
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
} from '@chakra-ui/react';

import { useItemActions } from '@/contexts/ItemActionsContext';
import { Item } from '@/utils/types';

type ItemActionMenuProps = {
  item: Item;
};

export const ItemActionMenu: React.FC<ItemActionMenuProps> = ({ item }) => {
  const { gmActions, openActionModal, playerActions, selectItem } =
    useItemActions();

  return (
    <>
      <Menu onOpen={() => selectItem(item)}>
        <MenuButton as={Button} size="sm">
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
                borderTop={
                  playerActions.length > 0 ? '3px solid black' : 'none'
                }
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
        </MenuList>
      </Menu>
    </>
  );
};
