import { Box, HStack, Image, Link, Text } from '@chakra-ui/react';

import { EXPLORER_URLS } from '@/utils/constants';
import { shortenAddress, shortenText } from '@/utils/helpers';
import { Character } from '@/utils/types';

type CharacterCardProps = Character & {
  chainId: number;
};

export const CharacterCard: React.FC<CharacterCardProps> = ({
  chainId,
  account,
  name,
  description,
  image,
}) => {
  return (
    <Box
      border="3px solid black"
      borderBottom="5px solid black"
      borderRight="5px solid black"
      transition="background 0.3s ease"
      w="100%"
      p={4}
    >
      <HStack>
        <Image
          alt="character avatar"
          background="gray.400"
          h="140px"
          objectFit="cover"
          src={image}
          w="140px"
        />
        <Text fontSize="lg">{name}</Text>
      </HStack>
      <Text>
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
        href={`${EXPLORER_URLS[chainId]}/address/${account}`}
        isExternal
      >
        {shortenAddress(account)}
        <Image
          alt="link to new tab"
          height="14px"
          src="/new-tab.svg"
          width="14px"
        />
      </Link>
    </Box>
  );
};
