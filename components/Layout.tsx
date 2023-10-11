import {
  Box,
  Button,
  Flex,
  Heading,
  Image,
  Link,
  Spacer,
  Text,
} from '@chakra-ui/react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import NextLink from 'next/link';

import { ActiveLink } from '@/components/ActiveLink';

export const Layout: React.FC<{ children: JSX.Element }> = ({ children }) => {
  return (
    <Flex direction="column" minH="100vh">
      <Box
        as="header"
        background="dark"
        pt={6}
        position="fixed"
        px={6}
        top={0}
        w="100%"
        zIndex={1000}
      >
        <Flex align="center" h="100%" justify="start" w="100%">
          <Link
            as={NextLink}
            href="/"
            ml={5}
            _hover={{ color: 'accent', textDecoration: 'none' }}
          >
            <Heading fontSize="22px" textTransform="uppercase">
              CharacterSheets
            </Heading>
          </Link>
          <Spacer />

          <Flex as="nav" gap={4} mr={10}>
            <ActiveLink href="/my-games">My games</ActiveLink>
            <ActiveLink href="/all-games">All games</ActiveLink>
          </Flex>
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              mounted,
            }) => {
              const connected = mounted && account && chain;

              return (
                <Flex
                  align="center"
                  cursor="pointer"
                  gap={3}
                  _hover={{
                    p: {
                      borderBottom: '2px solid black',
                    },
                  }}
                  {...(!mounted && {
                    'aria-hidden': true,
                    style: {
                      opacity: 0,
                      pointerEvents: 'none',
                      userSelect: 'none',
                    },
                  })}
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <Button
                          onClick={openConnectModal}
                          size="xs"
                          type="button"
                          variant="outline"
                        >
                          connect
                        </Button>
                      );
                    }

                    if (chain.unsupported) {
                      return (
                        <Button
                          onClick={openChainModal}
                          size="xs"
                          type="button"
                          variant="outline"
                        >
                          wrong network
                        </Button>
                      );
                    }

                    return (
                      <Button
                        onClick={openAccountModal}
                        size="xs"
                        type="button"
                        variant="outline"
                      >
                        {account.displayName}
                      </Button>
                    );
                  })()}
                </Flex>
              );
            }}
          </ConnectButton.Custom>
        </Flex>
        <Box background="white" height="1px" mt={4} />
      </Box>
      <Box mt="85px">{children}</Box>
      <Flex
        align="center"
        as="footer"
        background="black"
        borderTop="5px solid black"
        h={24}
        justify="center"
        marginTop="auto"
      >
        <Link as={NextLink} href="https://raidguild.org" isExternal>
          <Text
            alignItems="center"
            display="flex"
            fontFamily="Texturina"
            gap={2}
          >
            Built by{' '}
            <Image alt="RaidGuild logo" h="28px" src="/favicon.ico" w="28px" />{' '}
            RaidGuild
          </Text>
        </Link>
      </Flex>
    </Flex>
  );
};
