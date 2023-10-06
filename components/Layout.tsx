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
        pt={7}
        px={6}
        position="fixed"
        top={0}
        w="100%"
        zIndex={1000}
        bg="gray.900"
      >
        <Flex align="center" h="100%" justify="start" w="100%">
          <Link
            as={NextLink}
            fontSize="sm"
            href="/"
            variant="heading"
            _hover={{ borderColor: 'none' }}
          >
            <Flex direction="row">
              <Image
                alt="RaidGuild logo"
                h="28px"
                src="/favicon.ico"
                w="28px"
              />
              <Heading
                ml="10px"
                fontSize="24px"
                color={'primary.500'}
                variant={'noShadow'}
              >
                Character Sheets
              </Heading>
            </Flex>
          </Link>
          <Spacer />

          <Box mr={10}>
            <ActiveLink href="/my-games" variant="heading">
              My Games
            </ActiveLink>
            <ActiveLink href="/all-games" variant="text">
              All Games
            </ActiveLink>
          </Box>
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
                  // _hover={{
                  //   p: {
                  //     borderBottom: '2px solid black',
                  //   },
                  // }}
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
                          variant="outline"
                          color="whiteAlpha.800"
                          borderColor="primary.500"
                          onClick={openConnectModal}
                        >
                          {/* <Icon as={FaRegTimesCircle} color='raid' /> */}
                          Connect
                        </Button>
                      );
                    }

                    if (chain.unsupported) {
                      return (
                        <Button
                          variant="outline"
                          color="whiteAlpha.800"
                          borderColor="primary.500"
                          onClick={openChainModal}
                        >
                          Wrong network
                        </Button>
                      );
                    }

                    return (
                      <Button
                        variant="outline"
                        color="whiteAlpha.800"
                        borderColor="primary.500"
                        onClick={openAccountModal}
                      >
                        {account.displayName}
                      </Button>
                    );
                  })()}
                  {/* <Image
                      alt="down arrow"
                      height={4}
                      pb={1}
                      src="/icons/arrow-down.svg"
                      width={4}
                    /> */}
                </Flex>
              );
            }}
          </ConnectButton.Custom>
        </Flex>
        <Box h="1px" w="full" mt={4} background="primary.500"></Box>
      </Box>
      <Box mt={20} bg="gray.900">
        {children}
      </Box>
      <Flex
        align="center"
        as="footer"
        background="blackAlpha.900"
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
