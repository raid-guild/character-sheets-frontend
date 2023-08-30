import { Box, Flex, Link, Text } from '@chakra-ui/react';
import NextLink from 'next/link';

import { ActiveLink } from '@/components/ActiveLink';

export const Layout: React.FC<{ children: JSX.Element }> = ({ children }) => {
  return (
    <>
      <Box
        as="header"
        background="white"
        borderBottom="5px solid black"
        h={20}
        pb={1}
        position="fixed"
        top={0}
        w="100%"
        zIndex={1000}
      >
        <Flex align="center" h="100%" justify="center" px={10} w="100%">
          <Flex as="nav" justify="space-between" position="relative" w="100%">
            <Link as={NextLink} fontSize="sm" href="/" variant="heading">
              CS
            </Link>
            <Flex
              justify="space-between"
              position="absolute"
              left="50%"
              transform="translateX(-50%)"
              w={300}
            >
              <ActiveLink fontSize="sm" href="/my-games" variant="heading">
                My Games
              </ActiveLink>
              <ActiveLink fontSize="sm" href="/all-games" variant="heading">
                All Games
              </ActiveLink>
            </Flex>
            <Text fontSize="xs" variant="heading">
              Connect Wallet
            </Text>
          </Flex>
        </Flex>
        <Box background="white" borderTop="2px solid black" height={1} />
      </Box>
      <Box mt={20}>{children}</Box>
    </>
  );
};
