import { Box, Flex, Heading, Image, Link, Text } from '@chakra-ui/react';
import NextLink from 'next/link';

import { EXPLORER_URLS } from '@/utils/constants';
import { shortenAddress, shortenText } from '@/utils/helpers';
import { GameMeta } from '@/utils/types';

type GameCardProps = GameMeta & {
  chainId: number;
};

export const GameCard: React.FC<GameCardProps> = ({
  chainId,
  characters,
  description,
  experience,
  id,
  image,
  items,
  name,
}) => {
  return (
    <Box
      border="3px solid black"
      borderBottom="5px solid black"
      borderRight="5px solid black"
      p={8}
      transition="background 0.3s ease"
      w="360px"
    >
      <NextLink href={`/games/[gameId]`} as={`/games/${id}`}>
        <Box
          h="116px"
          transition="background 0.3s ease"
          _hover={{
            h2: {
              borderBottom: '2px solid black',
            },
          }}
        >
          <Heading
            borderBottom="2px solid transparent"
            display="inline-block"
            fontSize="3xl"
            mb={4}
            transition="all 0.3s ease"
            variant="primary"
          >
            {name}
          </Heading>
          <Text fontSize="sm">{shortenText(description, 60)}</Text>
        </Box>
      </NextLink>
      <Link
        alignItems="center"
        color="blue"
        display="inline-flex"
        fontSize="sm"
        gap={2}
        href={`${EXPLORER_URLS[chainId]}/address/${id}`}
        isExternal
        mb={4}
      >
        {shortenAddress(id)}
        <Image
          alt="link to new tab"
          height="14px"
          src="/icons/new-tab.svg"
          width="14px"
        />
      </Link>
      <Flex direction="row" align="center">
        <Image alt="users" height="20px" src="/icons/users.svg" width="20px" />
        <Text ml="2" mb="1">
          {characters.length} characters
        </Text>
      </Flex>
      <Flex direction="row" align="center">
        <Image alt="users" height="20px" src="/icons/items.svg" width="20px" />
        <Text ml="2" mb="1">
          {items.length} items
        </Text>
      </Flex>
      <Flex direction="row" align="center">
        <Image alt="users" height="20px" src="/icons/xp.svg" width="20px" />
        <Text ml="2" mb="1">
          {experience} XP
        </Text>
      </Flex>

      <Box mt="8">
        <NextLink href={`/games/[gameId]`} as={`/games/${id}`}>
          <Image
            alt="game emblem"
            background="gray.400"
            h="140px"
            objectFit="cover"
            src={image}
            w="100%"
          />
        </NextLink>
      </Box>
    </Box>
  );
};
