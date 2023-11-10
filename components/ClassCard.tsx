import {
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
import { useAccount } from 'wagmi';

import { shortenText } from '@/utils/helpers';
import { Class } from '@/utils/types';

type ClassCardProps = Class & {
  chainId: number;
  isMaster: boolean;
};

export const ClassCard: React.FC<ClassCardProps> = ({
  isMaster,
  ...classEntity
}) => {
  const toast = useToast();
  const { isConnected } = useAccount();
  const { classId, name, description, image, holders } = classEntity;

  return (
    <HStack
      border="1px solid white"
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
        {isConnected && <ActionMenu isMaster={isMaster} />}
      </VStack>
      <VStack align="flex-start">
        <Text fontSize="lg" fontWeight="bold">
          {name}
        </Text>
        <Text fontSize="md" mb={4}>
          {shortenText(description, 130)}
        </Text>
        <Text>
          Class ID:{' '}
          <Text as="span" fontSize="xs">
            {classId}
          </Text>
        </Text>
        <Text>Held By: {holders.length}</Text>
      </VStack>
    </HStack>
  );
};

export const SmallClassCard: React.FC<ClassCardProps> = ({
  isMaster,
  ...classEntity
}) => {
  const toast = useToast();
  const { isConnected } = useAccount();

  const { claimable, classId, name, description, image, holders } = classEntity;
  return (
    <HStack
      border="1px solid white"
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
        {isConnected && <ActionMenu isMaster={isMaster} />}
      </VStack>
      <VStack align="flex-start">
        <Text fontSize="md" fontWeight="bold">
          {name}
        </Text>
        <Text fontSize="sm" mb={4}>
          {shortenText(description, 130)}
        </Text>
        <Text fontSize="xs">
          Class ID:{' '}
          <Text as="span" fontSize="xs">
            {classId}
          </Text>
        </Text>
        <Text fontSize="xs">Held By: {holders.length}</Text>
        {!claimable ? (
          <Text fontSize="xs">
            This class can only be assigned by the GameMaster.
          </Text>
        ) : (
          <Text fontSize="xs">Anyone can claim this class.</Text>
        )}
      </VStack>
    </HStack>
  );
};

type ActionMenuProps = {
  isMaster: boolean;
};

const ActionMenu: React.FC<ActionMenuProps> = ({ isMaster }) => {
  const toast = useToast();

  return (
    <Menu>
      <MenuButton as={Button} size="sm">
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
