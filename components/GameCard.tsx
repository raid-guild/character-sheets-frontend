import {
  AspectRatio,
  Button,
  Heading,
  HStack,
  Link,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import NextLink from 'next/link';

import { GameTotals } from '@/components/GameTotals';
import { MultiSourceImage } from '@/components/MultiSourceImage';
import { getAddressUrl, getChainLabelFromId } from '@/lib/web3';
import { shortenAddress, shortenText } from '@/utils/helpers';
import { GameMeta } from '@/utils/types';

import { NetworkDisplay } from './NetworkDisplay';

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
    <Stack
      direction={{ base: 'column', md: 'row' }}
      bg="cardBG"
      justify="space-between"
      p={8}
      transition="background 0.3s ease"
      w="100%"
      spacing={12}
      align="center"
    >
      <AspectRatio ratio={1} w="100%" maxW="12rem">
        <MultiSourceImage
          alt="game emblem"
          objectFit="cover"
          src={image}
          w="100%"
          h="100%"
        />
      </AspectRatio>
      <VStack spacing={4} align={{ base: 'center', md: 'start' }} flex={1}>
        <Heading
          display="inline-block"
          fontSize={{ base: '32px', md: '40px' }}
          fontWeight="normal"
          lineHeight="40px"
          textAlign={{ base: 'center', md: 'left' }}
        >
          {name}
        </Heading>
        <VStack spacing={2} align={{ base: 'center', md: 'start' }}>
          <Text
            fontWeight={200}
            mb={2}
            textAlign={{ base: 'center', md: 'left' }}
          >
            {shortenText(description, 60)}
          </Text>
          <Link
            fontSize="sm"
            href={getAddressUrl(chainId, id)}
            isExternal
            fontWeight={300}
            mb={3}
            _hover={{}}
          >
            <HStack>
              <Text textDecoration={'underline'}>{shortenAddress(id)}</Text>
              <NetworkDisplay chainId={chainId} />
            </HStack>
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
    </Stack>
  );
};
