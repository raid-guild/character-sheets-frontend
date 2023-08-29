import { Box, Flex, Link, Text } from '@raidguild/design-system';
import NextLink from 'next/link';

export const Layout: React.FC<{ children: JSX.Element }> = ({ children }) => {
  return (
    <>
      <Box
        as="header"
        background="black"
        h={20}
        position="fixed"
        top={0}
        w="100%"
        zIndex={1000}
      >
        <Flex align="center" h="100%" justify="center" px={10} w="100%">
          <Flex as="nav" justify="space-between" position="relative" w="100%">
            <Link as={NextLink} href="/">
              CS
            </Link>
            <Flex
              justify="space-between"
              position="absolute"
              left="50%"
              transform="translateX(-50%)"
              w={200}
            >
              <Link as={NextLink} href="/my-games">
                My Games
              </Link>
              <Link as={NextLink} href="/all-games">
                All Games
              </Link>
            </Flex>
            <Text>Connect Wallet</Text>
          </Flex>
        </Flex>
      </Box>
      <Box mt={20}>{children}</Box>
    </>
  );
};
