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
  id,
  image,
  items,
  name,
}) => {
  return (
    <Box bg="blackAlpha.500" transition="background 0.3s ease" w="360px" p={8}>
      <Box h="130px">
        <NextLink href={`/games/[gameId]`} as={`/games/${id}`}>
          <Heading
            variant="noShadow"
            _hover={{
              color: 'primary.500',
              cursor: 'pointer',
              transition: 'color 1000ms linear',
              transitionDuration: '0.15s',
              transitionTimingFunction: 'ease-in-out',
            }}
          >
            {name}
          </Heading>
        </NextLink>
        {/* <Text h="100px">
          <Text as="span" fontSize="xs">
            {shortenText(description, 130)}
          </Text>
        </Text> */}
        <Link
          alignItems="center"
          color="white"
          display="flex"
          _hover={{
            color: 'primary.500',
            cursor: 'pointer',
          }}
          fontSize="sm"
          gap={2}
          href={`${EXPLORER_URLS[chainId]}/address/${id}`}
          isExternal
        >
          {shortenAddress(id)}
          <Image
            alt="link to new tab"
            height="14px"
            src="/icons/external-link.svg"
            width="14px"
          />
        </Link>
      </Box>
      <Flex direction="row" align="center">
        <Image alt="users" height="20px" src="/icons/users.svg" width="20px" />
        <Text color="gray.400" fontSize="xl" ml="2" mb="1">
          {characters.length} characters
        </Text>
      </Flex>
      <Flex direction="row" align="center">
        <Image alt="users" height="20px" src="/icons/items.svg" width="20px" />
        <Text color="gray.400" fontSize="xl" ml="2" mb="1">
          {items.length} items
        </Text>
      </Flex>
      <Flex direction="row" align="center">
        <Image alt="users" height="20px" src="/icons/xp.svg" width="20px" />
        <Text color="gray.400" fontSize="xl" ml="2" mb="1">
          xp
        </Text>
      </Flex>
      {/* <Text>Number of classes: {classes.length}</Text> */}

      <Box mt="8">
        <Image
          alt="game emblem"
          rounded="5px"
          background="gray.400"
          h="140px"
          objectFit="cover"
          src={image}
          w="100%"
        />
      </Box>
    </Box>
  );
};
