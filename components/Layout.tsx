import {
  Box,
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
        background="white"
        borderBottom="5px solid black"
        h={20}
        pb={1}
        position="fixed"
        top={0}
        w="100%"
        zIndex={1000}
      >
        <Flex align="center" h="100%" justify="start" px={6} w="100%">
          <Link as={NextLink} fontSize="sm" href="/">
            <Flex align="center">
              <Image
                alt="RaidGuild logo"
                h="28px"
                src="/favicon.ico"
                w="28px"
              />
              <Heading ml="10px" size="xs">
                CharacterSheets
              </Heading>
            </Flex>
          </Link>
          <Spacer />

          <Flex as="nav" gap={4} mr={10}>
            <ActiveLink href="/my-games">My Games</ActiveLink>
            <ActiveLink href="/all-games">All Games</ActiveLink>
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
                        <button onClick={openConnectModal} type="button">
                          <Text
                            borderBottom="2px solid transparent"
                            transition="all 0.2s ease-in-out"
                          >
                            Connect Wallet
                          </Text>
                        </button>
                      );
                    }

                    if (chain.unsupported) {
                      return (
                        <button onClick={openChainModal} type="button">
                          <Text
                            borderBottom="2px solid transparent"
                            transition="all 0.2s ease-in-out"
                          >
                            Wrong network
                          </Text>
                        </button>
                      );
                    }

                    return (
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={openAccountModal} type="button">
                          <Text
                            borderBottom="2px solid transparent"
                            transition="all 0.2s ease-in-out"
                          >
                            {account.displayName}
                          </Text>
                        </button>
                      </div>
                    );
                  })()}
                  <Image
                    alt="down arrow"
                    height={4}
                    pb={1}
                    src="/icons/arrow-down.svg"
                    width={4}
                  />
                </Flex>
              );
            }}
          </ConnectButton.Custom>
        </Flex>
        <Box background="white" borderTop="2px solid black" height={1} />
      </Box>
      <Box mt={20}>{children}</Box>
      <Flex
        align="center"
        as="footer"
        background="white"
        borderTop="5px solid black"
        h={24}
        justify="center"
        marginTop="auto"
      >
        <Link as={NextLink} href="https://raidguild.org" isExternal>
          <Text alignItems="center" display="flex" gap={2}>
            Built by{' '}
            <Image alt="RaidGuild logo" h="28px" src="/favicon.ico" w="28px" />{' '}
            RaidGuild
          </Text>
        </Link>
      </Flex>
    </Flex>
  );
};
