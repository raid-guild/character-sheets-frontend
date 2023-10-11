import { Box, Flex, Heading, Image, Link, Text } from '@chakra-ui/react';
import NextLink from 'next/link';

import { EXPLORER_URLS } from '@/utils/constants';
import { shortenAddress } from '@/utils/helpers';
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
}) => {
  return (
    <Box
      borderBottom="5px solid rgba(255,255,255,0.2)"
      transition="background 0.3s ease"
      pb="20px"
      w="480px"
    >
      <Link
        alignItems="center"
        display="inline-flex"
        fontSize="sm"
        gap={2}
        href={`${EXPLORER_URLS[chainId]}/address/${id}`}
        isExternal
      >
        {shortenAddress(id)}
      </Link>
      <NextLink href={`/games/[gameId]`} as={`/games/${id}`}>
        <Box
          mb={10}
          transition="background 0.3s ease"
          _hover={{
            h2: {
              color: 'accent',
            },
          }}
        >
          <Heading
            display="inline-block"
            fontSize="40px"
            fontWeight="normal"
            lineHeight="40px"
          >
            {name}
          </Heading>
          {/* TODO: Possibly bring back description once re-design is complete */}
          {/* <Text fontSize="sm">{shortenText(description, 60)}</Text> */}
        </Box>
      </NextLink>

      <Flex align="center" direction="row" py={2}>
        <Image alt="users" height="20px" src="/icons/users.svg" width="20px" />
        <Text fontSize="lg" fontWeight="400" ml="4">
          {characters.length} characters
        </Text>
      </Flex>
      <Flex align="center" direction="row" py={2}>
        <Image alt="users" height="20px" src="/icons/xp.svg" width="20px" />
        <Text fontSize="lg" fontWeight="400" ml="4">
          {experience} XP
        </Text>
      </Flex>
      <Flex align="center" direction="row" py={2}>
        <Image alt="users" height="20px" src="/icons/items.svg" width="20px" />
        <Text fontSize="lg" fontWeight="400" ml="4">
          {items.length} items
        </Text>
      </Flex>

      <Box mt="8">
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
    </Box>
  );
};
