import { Box, Flex, Image, Link, Text } from '@chakra-ui/react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
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
          <Flex
            alignItems="center"
            as="nav"
            justify="space-between"
            position="relative"
            w="100%"
          >
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
                              fontSize="xs"
                              transition="all 0.2s ease-in-out"
                              variant="heading"
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
                              fontSize="xs"
                              transition="all 0.2s ease-in-out"
                              variant="heading"
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
                              fontSize="xs"
                              transition="all 0.2s ease-in-out"
                              variant="heading"
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
        </Flex>
        <Box background="white" borderTop="2px solid black" height={1} />
      </Box>
      <Box mt={20}>{children}</Box>
    </>
  );
};
