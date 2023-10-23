import { HStack, Image, Text, VStack } from '@chakra-ui/react';

import { GameMeta } from '@/utils/types';

type GameTotalsProps = Pick<GameMeta, 'experience' | 'characters' | 'items'>;

export const GameTotals: React.FC<GameTotalsProps> = ({
  experience,
  characters,
  items,
}) => {
  return (
    <VStack align="flex-start" spacing={4}>
      <Text
        fontFamily="mono"
        letterSpacing="1px"
        fontSize="sm"
        textTransform="uppercase"
      >
        Game Totals
      </Text>
      <HStack spacing={0} align="stretch">
        <Image
          h="100%"
          src="/icons/xp-box-left.svg"
          w="12px"
          alt="xp-box-left"
        />
        <HStack
          color="softyellow"
          spacing={4}
          borderTop="2px solid"
          borderBottom="2px solid"
          borderColor="rgba(219, 211, 139, 0.75)"
          mx="-1px"
          px={4}
        >
          <Text fontSize="lg" fontWeight="700">
            {experience}
          </Text>
          <Image alt="users" height="20px" src="/icons/xp.svg" width="20px" />
        </HStack>
        <Image
          h="100%"
          src="/icons/xp-box-left.svg"
          w="12px"
          transform="rotate(180deg)"
          alt="xp-box-right"
        />
      </HStack>
      <HStack spacing={4}>
        <Image alt="users" height="20px" src="/icons/users.svg" width="20px" />
        <Text fontSize="lg" fontWeight="400">
          {characters.length} characters
        </Text>
      </HStack>
      <HStack spacing={4}>
        <Image alt="users" height="20px" src="/icons/items.svg" width="20px" />
        <Text fontSize="lg" fontWeight="400">
          {items.length} items
        </Text>
      </HStack>
    </VStack>
  );
};
