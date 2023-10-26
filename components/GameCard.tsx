import {
  Box,
  Flex,
  Heading,
  Image,
  Link,
  Text,
  VStack,
} from '@chakra-ui/react';
import NextLink from 'next/link';

import { EXPLORER_URLS } from '@/utils/constants';
import { formatExperience, shortenAddress, shortenText } from '@/utils/helpers';
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
    <VStack
      align="Start"
      borderBottom="5px solid rgba(255,255,255,0.2)"
      pb={5}
      transition="background 0.3s ease"
      w="450px"
    >
      <VStack align="align" mb={2} transition="background 0.3s ease">
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
      </VStack>

      <Flex align="center" direction="row" py={1}>
        <Image alt="users" height="20px" src="/icons/users.svg" width="20px" />
        <Text fontSize="lg" fontWeight="400" ml="4">
          {characters.length} characters
        </Text>
      </Flex>
      <Flex align="center" direction="row" py={1}>
        <Image alt="users" height="20px" src="/icons/xp.svg" width="20px" />
        <Text fontSize="lg" fontWeight="400" ml="4">
          {formatExperience(experience)} XP
        </Text>
      </Flex>
      <Flex align="center" direction="row" py={1}>
        <Image alt="users" height="20px" src="/icons/items.svg" width="20px" />
        <Text fontSize="lg" fontWeight="400" ml="4">
          {items.length} items
        </Text>
      </Flex>

      <Box mt="8" w="full">
        <NextLink href={`/games/[gameId]`} as={`/games/${id}`}>
          <Image
            alt="game emblem"
            background="gray.400"
            h="120px"
            objectFit="cover"
            src={image}
            w="100%"
          />
        </NextLink>
      </Box>
    </VStack>
  );
};
