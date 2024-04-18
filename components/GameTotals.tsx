import {
  Button,
  HStack,
  Image,
  Text,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';

import { LevelProgressionModal } from '@/components/Modals/LevelProgressionModal';
import { GameMeta } from '@/utils/types';

import { XPDisplay } from './XPDisplay';

type GameTotalsProps = Pick<GameMeta, 'experience' | 'characters' | 'items'>;

export const GameTotals: React.FC<GameTotalsProps> = ({
  experience,
  characters,
  items,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <VStack align="flex-start" spacing={4}>
      <Text letterSpacing="3px" fontSize="2xs" textTransform="uppercase">
        Game Totals
      </Text>
      <XPDisplay experience={experience} />
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
      <Button onClick={onOpen} size="xs">
        Level progression
      </Button>
      <LevelProgressionModal isOpen={isOpen} onClose={onClose} />
    </VStack>
  );
};
