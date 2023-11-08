import {
  AspectRatio,
  Button,
  Heading,
  HStack,
  Image,
  Link,
  Text,
  VStack,
} from '@chakra-ui/react';
import NextLink from 'next/link';

import { GameTotals } from '@/components/GameTotals';
import { getAddressUrl, getChainLabelFromId } from '@/lib/web3';
import { shortenAddress, shortenText } from '@/utils/helpers';
import { GameMeta } from '@/utils/types';

export const GameCard: React.FC<GameMeta> = ({
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
        <Image
          alt="game emblem"
          objectFit="cover"
          src={image}
          w="100%"
          h="100%"
        />
      </AspectRatio>
      <VStack spacing={4} align="flex-start" flex={1}>
        <Heading
          display="inline-block"
          fontSize="40px"
          fontWeight="normal"
          lineHeight="40px"
        >
          {name}
        </Heading>
        <VStack spacing={2} align="flex-start">
          <Text fontWeight={200} mb={2}>
            {shortenText(description, 60)}
          </Text>
          <Link
            fontSize="sm"
            href={getAddressUrl(chainId, id)}
            isExternal
            fontWeight={300}
            mb={3}
            textDecoration={'underline'}
          >
            {shortenAddress(id)}
          </Link>
        </VStack>
        <NextLink
          as={`/games/${getChainLabelFromId(chainId)}/${id}`}
          href={`/games/[chainLabel]/[gameId]`}
        >
          <Button variant="play">play</Button>
        </NextLink>
      </VStack>

      <GameTotals
        experience={experience}
        characters={characters}
        items={items}
      />
    </HStack>
  );
};
