import { HStack, Image, Text, VStack } from '@chakra-ui/react';

import { formatExperience } from '@/utils/helpers';
import { GameMeta } from '@/utils/types';

import { XPDisplay } from './XPDisplay';

type GameTotalsProps = Pick<GameMeta, 'experience' | 'characters' | 'items'>;

export const GameTotals: React.FC<GameTotalsProps> = ({
  experience,
  characters,
  items,
}) => {
  return (
    <VStack align="flex-start" spacing={4}>
      <Text letterSpacing="3px" fontSize="2xs" textTransform="uppercase">
        Game Totals
      </Text>
      <XPDisplay experience={formatExperience(experience)} />
      <HStack spacing={4}>
        <Image alt="users" height="20px" src="/icons/users.svg" width="20px" />
        <Text fontWeight="400">
          {characters.length} character{characters.length !== 1 && 's'}
        </Text>
      </HStack>
      <HStack spacing={4}>
        <Image alt="users" height="20px" src="/icons/items.svg" width="20px" />
        <Text fontWeight="400">
          {items.length} item{items.length !== 1 && 's'}
        </Text>
      </HStack>
    </VStack>
  );
};
