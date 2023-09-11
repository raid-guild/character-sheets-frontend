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
  VStack,
} from '@chakra-ui/react';

import { useActions } from '@/contexts/ActionsContext';
import { EXPLORER_URLS } from '@/utils/constants';
import { shortenAddress, shortenText } from '@/utils/helpers';
import { Character } from '@/utils/types';

export const CharacterCard: React.FC<{
  chainId: number;
  character: Character;
}> = ({ chainId, character }) => {
  const { experience, account, name, description, image } = character;

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
          alt="character avatar"
          h="140px"
          objectFit="cover"
          src={image}
          w="100px"
        />
        <Button size="sm">View</Button>
        <ActionMenu character={character} />
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
            src="/new-tab.svg"
            width="14px"
          />
        </Link>
        <Box background="black" h="3px" my={4} w={20} />
        <Text>
          Classes:{' '}
          <Text as="span" fontSize="xs">
            {shortenText('Villager', 70)}
          </Text>
        </Text>
        <Text>XP: {experience}</Text>
        <Text>Items: 0</Text>
      </VStack>
    </HStack>
  );
};

export const SmallCharacterCard: React.FC<{
  chainId: number;
  character: Character;
}> = ({ chainId, character }) => {
  const { experience, account, name, description, image } = character;

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
        <Image alt="character avatar" h="60%" objectFit="cover" src={image} />
        <Button size="sm">View</Button>
        <ActionMenu character={character} />
      </VStack>
      <VStack align="flex-start">
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
            src="/new-tab.svg"
            width="14px"
          />
        </Link>
        <Box background="black" h="3px" my={4} w={20} />
        <Text fontSize="xs">Classes: {shortenText('Villager', 32)}</Text>
        <Text fontSize="xs">XP: {experience}</Text>
        <Text fontSize="xs">Items: 0</Text>
      </VStack>
    </HStack>
  );
};

type ActionMenuProps = {
  character: Character;
};

const ActionMenu: React.FC<ActionMenuProps> = ({ character }) => {
  const { setCharacter, playerActions, gmActions, openActionModal } =
    useActions();

  return (
    <>
      <Menu onOpen={() => setCharacter(character)}>
        <MenuButton as={Button} size="sm">
          Actions
        </MenuButton>
        <MenuList>
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
            <MenuItem key={action}>{action}</MenuItem>
          ))}
          {gmActions.length > 0 && (
            <>
              <Text
                borderBottom="1px solid black"
                borderTop="3px solid black"
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
