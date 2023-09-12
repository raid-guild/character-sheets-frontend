import {
  Box,
  Button,
  HStack,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  useToast,
  VStack,
} from '@chakra-ui/react';

import { CardTypes, useActions } from '@/contexts/ActionsContext';
import { shortenText } from '@/utils/helpers';
import { Class } from '@/utils/types';

type ClassCardProps = {
  class: Class;
};

export const ClassCard: React.FC<ClassCardProps> = ({ class: classEntity }) => {
  const toast = useToast();

  const { classId, name, description, image } = classEntity;
  return (
    <HStack
      border="3px solid black"
      borderBottom="5px solid black"
      borderRight="5px solid black"
      h="300px"
      transition="background 0.3s ease"
      p={4}
      w="100%"
    >
      <VStack w="30%">
        <Image
          alt="class emblem"
          h="140px"
          objectFit="cover"
          src={image}
          w="100px"
        />
        <Button
          onClick={() => {
            toast({
              title: 'Coming soon!',
              position: 'top',
              status: 'warning',
            });
          }}
          size="sm"
        >
          View
        </Button>
        <ActionMenu class={classEntity} />
      </VStack>
      <VStack align="flex-start">
        <Text fontSize="lg" fontWeight="bold">
          {name}
        </Text>
        <Text>
          Description:{' '}
          <Text as="span" fontSize="xs">
            {shortenText(description, 130)}
          </Text>
        </Text>
        <Text>
          Class ID:{' '}
          <Text as="span" fontSize="xs">
            {classId}
          </Text>
        </Text>

        <Box background="black" h="3px" my={4} w={20} />
        <Text>Held By: 0</Text>
        <Text>Equipped By: 0</Text>
      </VStack>
    </HStack>
  );
};

export const SmallClassCard: React.FC<ClassCardProps> = ({
  class: classEntity,
}) => {
  const toast = useToast();

  const { classId, name, description, image } = classEntity;
  return (
    <HStack
      border="3px solid black"
      borderBottom="5px solid black"
      borderRight="5px solid black"
      transition="background 0.3s ease"
      p={4}
      spacing={8}
      w="100%"
    >
      <VStack align="center" h="100%" w="35%">
        <Image alt="class emblem" h="60%" objectFit="cover" src={image} />
        <Button
          onClick={() => {
            toast({
              title: 'Coming soon!',
              position: 'top',
              status: 'warning',
            });
          }}
          size="sm"
        >
          View
        </Button>
        <ActionMenu class={classEntity} />
      </VStack>
      <VStack align="flex-start">
        <Text fontSize="md" fontWeight="bold">
          {name}
        </Text>
        <Text fontSize="xs">{shortenText(description, 130)}</Text>
        <Text fontSize="xs">
          Class ID:{' '}
          <Text as="span" fontSize="xs">
            {classId}
          </Text>
        </Text>

        <Box background="black" h="3px" my={4} w={20} />
        <Text fontSize="xs">Held By: 0</Text>
        <Text fontSize="xs">Equipped By: 0</Text>
      </VStack>
    </HStack>
  );
};

type ActionMenuProps = {
  class: Class;
};

const ActionMenu: React.FC<ActionMenuProps> = ({ class: classEntity }) => {
  const { selectEntity, playerActions, gmActions, openActionModal } =
    useActions();

  return (
    <Menu onOpen={() => selectEntity(CardTypes.CLASS, classEntity)}>
      <MenuButton as={Button} size="sm">
        Actions
      </MenuButton>
      <MenuList>
        {playerActions.length > 0 && (
          <>
            <Text
              borderBottom="1px solid black"
              fontSize="12px"
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
  );
};
