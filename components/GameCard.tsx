import { Box, Flex, Image, Link, Text } from '@chakra-ui/react';

import { EXPLORER_URLS } from '@/utils/constants';
import { shortenAddress, shortenText, uriToHttp } from '@/utils/helpers';
import { Game } from '@/utils/types';

type GameCardProps = Game & {
  chainId: number;
};

export const GameCard: React.FC<GameCardProps> = ({
  chainId,
  characters,
  classes,
  description,
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
      h="475px"
      transition="background 0.3s ease"
      w="360px"
      _hover={{
        background: 'gray.100',
        cursor: 'pointer',
      }}
    >
      <Image
        alt="game emblem"
        background="gray.400"
        h="140px"
        objectFit="cover"
        src={uriToHttp(image)[0]}
        w="100%"
      />
      <Flex
        align="center"
        borderBottom="3px solid black"
        borderTop="3px solid black"
        justify="center"
        h="50px"
      >
        <Text fontSize="lg">{name}</Text>
      </Flex>
      <Box p={4}>
        <Text h="100px">
          Description:{' '}
          <Text as="span" fontSize="xs">
            {shortenText(description, 130)}
          </Text>
        </Text>
        <Link
          alignItems="center"
          color="blue"
          display="flex"
          fontSize="sm"
          gap={2}
          href={`${EXPLORER_URLS[chainId]}/address/${id}`}
          isExternal
        >
          {shortenAddress(id)}
          <Image
            alt="link to new tab"
            height="14px"
            src="/new-tab.svg"
            width="14px"
          />
        </Link>
        <Box background="black" h="3px" my={4} w={20} />
        <Text>Number of characters: {characters.length}</Text>
        <Text>Number of classes: {classes.length}</Text>
        <Text>Number of items: {items.length}</Text>
      </Box>
    </Box>
  );
};
