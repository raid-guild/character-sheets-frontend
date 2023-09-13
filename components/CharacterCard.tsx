import {
  Box,
  Button,
  HStack,
  Image,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  useToast,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';

import { useActions } from '@/contexts/ActionsContext';
import { EXPLORER_URLS } from '@/utils/constants';
import { shortenAddress, shortenText } from '@/utils/helpers';
import { Character } from '@/utils/types';

import { ClassTag, VillagerClassTag } from './ClassTag';

export const CharacterCard: React.FC<{
  chainId: number;
  character: Character;
}> = ({ chainId, character }) => {
  const toast = useToast();

  const { account, classes, items, description, experience, image, name } =
    character;

  const amountOfItems = items.reduce(
    (acc, item) => acc + Number(item.amount),
    0,
  );

  return (
    <HStack
      border="3px solid black"
      borderBottom="5px solid black"
      borderRight="5px solid black"
      h="300px"
      transition="background 0.3s ease"
      p={4}
      w="100%"
      align="stretch"
    >
      <VStack w="20%">
        <Box pos="relative">
          <Image
            alt="character avatar"
            w="120px"
            h="180px"
            objectFit="cover"
            src={image}
          />
          <HStack
            bg="white"
            border="1px solid black"
            pos="absolute"
            right="0"
            bottom="0"
            px={1}
            fontSize="xs"
          >
            <Text>{experience} XP</Text>
          </HStack>
        </Box>
        <VStack align="stretch" w="120px">
          <Button
            onClick={() => {
              toast({
                title: 'Coming soon!',
                position: 'top',
                status: 'warning',
              });
            }}
            size="sm"
            w="100%"
          >
            View
          </Button>
          <ActionMenu character={character} />
        </VStack>
      </VStack>
      <VStack align="flex-start" flex={1}>
        <Text fontSize="lg" fontWeight="bold">
          {name}
        </Text>
        <Text fontSize="sm">{shortenText(description, 130)}</Text>
        <Link
          alignItems="center"
          color="blue"
          display="flex"
          fontSize="sm"
          gap={2}
          href={`${EXPLORER_URLS[chainId]}/address/${account}`}
          isExternal
          p={0}
        >
          {shortenAddress(account)}
          <Image
            alt="link to new tab"
            height="14px"
            src="/icons/new-tab.svg"
            width="14px"
          />
        </Link>
        <Box background="black" h="3px" my={4} w={20} />
        <Wrap>
          <WrapItem>
            <VillagerClassTag />
          </WrapItem>
          {classes.map(classEntity => (
            <WrapItem key={classEntity.classId}>
              <ClassTag {...classEntity} />
            </WrapItem>
          ))}
        </Wrap>
        <Text>Items: {amountOfItems}</Text>
      </VStack>
    </HStack>
  );
};

export const SmallCharacterCard: React.FC<{
  chainId: number;
  character: Character;
}> = ({ chainId, character }) => {
  const toast = useToast();

  const { account, classes, description, items, experience, image, name } =
    character;

  const amountOfItems = items.reduce(
    (acc, item) => acc + Number(item.amount),
    0,
  );

  return (
    <HStack
      border="3px solid black"
      borderBottom="5px solid black"
      borderRight="5px solid black"
      transition="background 0.3s ease"
      p={4}
      spacing={5}
      w="100%"
      align="stretch"
    >
      <VStack align="center" h="100%" w="30%">
        <Box pos="relative">
          <Image
            alt="character avatar"
            w="100px"
            h="150px"
            objectFit="cover"
            src={image}
          />
          <HStack
            bg="white"
            border="1px solid black"
            pos="absolute"
            right="0"
            bottom="0"
            px={1}
            fontSize="2xs"
          >
            <Text>{experience} XP</Text>
          </HStack>
        </Box>
        <VStack align="stretch" w="100px">
          <Button
            onClick={() => {
              toast({
                title: 'Coming soon!',
                position: 'top',
                status: 'warning',
              });
            }}
            size="sm"
            w="100%"
          >
            View
          </Button>
          <ActionMenu character={character} />
        </VStack>
      </VStack>
      <VStack align="flex-start" flex={1}>
        <Text fontSize="md" fontWeight="bold">
          {name}
        </Text>
        <Text fontSize="xs">{shortenText(description, 130)}</Text>
        <Link
          alignItems="center"
          color="blue"
          display="flex"
          fontSize="sm"
          gap={2}
          href={`${EXPLORER_URLS[chainId]}/address/${account}`}
          isExternal
          p={0}
        >
          {shortenAddress(account)}
          <Image
            alt="link to new tab"
            height="14px"
            src="/icons/new-tab.svg"
            width="14px"
          />
        </Link>
        <Box background="black" h="3px" my={2} w={20} />
        <Wrap>
          <WrapItem>
            <VillagerClassTag size="sm" />
          </WrapItem>
          {classes.map(classEntity => (
            <WrapItem key={classEntity.classId}>
              <ClassTag {...classEntity} size="sm" />
            </WrapItem>
          ))}
        </Wrap>
        <Text fontSize="xs">Items: {amountOfItems}</Text>
      </VStack>
    </HStack>
  );
};

type ActionMenuProps = {
  character: Character;
};

const ActionMenu: React.FC<ActionMenuProps> = ({ character }) => {
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
