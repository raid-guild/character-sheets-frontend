import { Box, Flex, Heading, Image, Link, Text, VStack } from '@chakra-ui/react';
import NextLink from 'next/link';

import { EXPLORER_URLS } from '@/utils/constants';
import { shortenAddress } from '@/utils/helpers';
import { GameMeta } from '@/utils/types';
import { shortenText } from '@/utils/helpers';
import { start } from 'repl';

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
  description
}) => {
  return (
    <VStack
      borderBottom="5px solid rgba(255,255,255,0.2)"
      transition="background 0.3s ease"
      pb={5}
      w="450px"
      align={"start"}
    >
        <VStack
          mb={2}
          transition="background 0.3s ease"
          align={"start"}
        >
          <Link
            fontSize="sm"
            href={`${EXPLORER_URLS[chainId]}/address/${id}`}
            isExternal
            fontWeight={300}
            mb={3}
            textDecoration={'underline'}>
          {shortenAddress(id)}
        </Link>
        <NextLink href={`/games/[gameId]`} as={`/games/${id}`}>
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
        <Text mb={2} fontWeight={200} fontSize="xl">{shortenText(description, 60)}</Text>
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
          {experience} XP
        </Text>
      </Flex>
      <Flex align="center" direction="row" py={1}>
        <Image alt="users" height="20px" src="/icons/items.svg" width="20px" />
        <Text fontSize="lg" fontWeight="400" ml="4">
          {items.length} items
        </Text>
      </Flex>

      <Box w={'full'} mt="8">
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
