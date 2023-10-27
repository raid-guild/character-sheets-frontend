import {
  AspectRatio,
  Heading,
  HStack,
  Image,
  Link,
  Text,
  VStack,
} from '@chakra-ui/react';
import NextLink from 'next/link';

import { GameTotals } from '@/components/GameTotals';
import { EXPLORER_URLS } from '@/utils/constants';
import { shortenAddress, shortenText } from '@/utils/helpers';
import { GameMeta } from '@/utils/types';

type GameCardProps = GameMeta & {
  chainId: number;
};

export const GameCard: React.FC<GameCardProps> = ({
  chainId,
  characters,
  experience,
  id,
  image,
  items,
  name,
  description,
}) => {
  return (
    <HStack
      bg="cardBG"
      justify="space-between"
      p={8}
      transition="background 0.3s ease"
      w="100%"
      spacing={12}
    >
      <AspectRatio ratio={1} w="100%" maxW="12rem">
        <NextLink href={`/games/[gameId]`} as={`/games/${id}`}>
          <Image
            alt="game emblem"
            background="gray.400"
            objectFit="cover"
            src={image}
            w="100%"
            h="100%"
          />
        </NextLink>
      </AspectRatio>
      <VStack spacing={4} align="flex-start" flex={1}>
        <NextLink as={`/games/${id}`} href={`/games/[gameId]`}>
          <Heading
            display="inline-block"
            fontSize="40px"
            fontWeight="normal"
            lineHeight="40px"
            _hover={{
              color: 'accent',
            }}
          >
            {name}
          </Heading>
        </NextLink>
        <Text fontSize="xl" fontWeight={200} mb={2}>
          {shortenText(description, 60)}
        </Text>
        <Link
          fontSize="sm"
          href={`${EXPLORER_URLS[chainId]}/address/${id}`}
          isExternal
          fontWeight={300}
          mb={3}
          textDecoration={'underline'}
        >
          {shortenAddress(id)}
        </Link>
      </VStack>
      <GameTotals
        experience={experience}
        characters={characters}
        items={items}
      />
    </HStack>
  );
};
