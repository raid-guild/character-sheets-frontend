import { CheckIcon } from '@chakra-ui/icons';
import {
  AspectRatio,
  Divider,
  Flex,
  HStack,
  Image,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useAccount } from 'wagmi';

import { ItemActionMenu } from '@/components/ActionMenus/ItemActionMenu';
import { useGame } from '@/contexts/GameContext';
import { shortenText } from '@/utils/helpers';
import { Item } from '@/utils/types';

type ItemCardProps = Item & {
  chainId: number;
  holderId?: string;
};

export const ItemCard: React.FC<ItemCardProps> = ({ holderId, ...item }) => {
  const { isConnected } = useAccount();

  const {
    itemId,
    name,
    description,
    image,
    supply,
    totalSupply,
    holders,
    equippers,
    soulbound,
  } = item;

  const { character } = useGame();

  const isEquipped =
    equippers.length > 0 &&
    equippers.some(equippedBy => equippedBy.characterId === holderId);

  return (
    <VStack spacing={3} w="100%" h="100%">
      <VStack
        transition="background 0.3s ease"
        p={{ base: 4, md: 6, lg: 8 }}
        spacing={3}
        w="100%"
        borderRadius="md"
        bg="whiteAlpha.100"
        flexGrow={1}
        justify="space-between"
      >
        <VStack spacing={3} w="100%">
          <AspectRatio
            ratio={1}
            h="15rem"
            maxH="15rem"
            w="100%"
            _before={{
              h: '15rem',
              maxH: '15rem',
            }}
          >
            <Image
              alt={name}
              w="100%"
              style={{
                objectFit: 'contain',
              }}
              src={image}
            />
          </AspectRatio>
          <Text fontSize="md" fontWeight="500" w="100%">
            {name}
          </Text>
          <Text fontSize="sm" w="100%">
            {shortenText(description, 130)}
          </Text>
          {isEquipped && (
            <>
              <HStack w="100%" spacing={4}>
                <Flex
                  borderRadius="50%"
                  w="1.5rem"
                  h="1.5rem"
                  top={2}
                  right={2}
                  bg="dark"
                  justify="center"
                  align="center"
                >
                  <CheckIcon color="white" w="0.75rem" />
                </Flex>
                <Text
                  fontSize="2xs"
                  textTransform="uppercase"
                  letterSpacing="2px"
                >
                  Equipped
                </Text>
              </HStack>
              <Divider borderColor="whiteAlpha.300" />
            </>
          )}
        </VStack>
        <SimpleGrid columns={{ base: 2, sm: 3 }} w="100%" spacing={3} mt="4">
          <ItemValue label="Item ID" value={itemId} />
          <ItemValue
            label="Held By"
            value={`${holders.length} character${
              holders.length !== 1 ? 's' : ''
            }`}
          />
          <ItemValue label="Soulbound" value={soulbound ? 'Yes' : 'No'} />
          <ItemValue
            label="Item Supply"
            value={`${supply.toString()} / ${totalSupply.toString()}`}
          />
          <ItemValue
            label="Equipped By"
            value={`${equippers.length} character${
              equippers.length !== 1 ? 's' : ''
            }`}
          />
          {/*
          <ItemValue
            label="Can I Claim?"
            value={isConnected ? '?' : 'Wallet not connected'}
          />
          */}
        </SimpleGrid>
      </VStack>
      {isConnected && !!character && (
        <ItemActionMenu item={item} variant="solid" />
      )}
    </VStack>
  );
};

const ItemValue: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => {
  return (
    <VStack align="flex-start" spacing={2}>
      <Text letterSpacing="2px" fontSize="3xs" textTransform="uppercase">
        {label}
      </Text>
      <Text fontSize="2xs" fontWeight="500">
        {value}
      </Text>
    </VStack>
  );
};
