import {
  Box,
  Button,
  Flex,
  Heading,
  Image,
  Link,
  Spacer,
  Text,
  textDecoration,
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
        px={6}
        position="fixed"
        top={0}
        w="100%"
        zIndex={1000}
      >
        <Flex align="center" h="100%" justify="start" w="100%">
          <Link as={NextLink} ml={5} href="/" _hover={{textDecoration:'none', color: 'accent'}}>
              <Heading fontSize="22px" fontWeight='regular' textTransform='uppercase' color={"inherit"} >
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
                        <Button size='xs' onClick={openConnectModal} type="button" variant={"outline"}>
                          connect
                        </Button>
                      );
                    }

                    if (chain.unsupported) {
                      return (
                          <Button size='xs' onClick={openChainModal} type="button" variant={"outline"}>
                            wrong network
                          </Button>
                      );
                    }

                    return (
                        <Button size='xs' onClick={openAccountModal} type="button" variant={"outline"}>
                          {account.displayName}
                        </Button>
                    );
                  })()}
                </Flex>
              );
            }}
          </ConnectButton.Custom>
        </Flex>
        <Box background="white" mt={4} height={"1px"} />
      </Box>
      <Box mt={"85px"}>{children}</Box>
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
          <Text alignItems="center" fontFamily={'Texturina'} display="flex" gap={2}>
            Built by{' '}
            <Image alt="RaidGuild logo" h="28px" src="/favicon.ico" w="28px" />{' '}
            RaidGuild
          </Text>
        </Link>
      </Flex>
    </Flex>
  );
};
