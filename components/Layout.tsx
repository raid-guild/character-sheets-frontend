import { Box, Button, Flex, Heading, Icon, Image, Link, Text, Spacer } from '@chakra-ui/react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import NextLink from 'next/link';

import { ActiveLink } from '@/components/ActiveLink';
import {
  FaCopy,
  FaRegSun,
  FaCaretDown,
  FaRegTimesCircle,
} from 'react-icons/fa';

export const Layout: React.FC<{ children: JSX.Element }> = ({ children }) => {
  return (
    <Flex direction="column" minH="100vh">
      <Box
        as="header"
        py={7}
        px={8}
        position="fixed"
        top={0}
        w="100%"
        zIndex={1000}
        bg={"rgba(0,0,0,0.85)"}        
      >
        <Flex align="center" h="100%" justify="start" w="100%">

            <Link as={NextLink} fontSize="sm" href="/" variant="heading" _hover={{borderColor: 'none'}}>
              <Heading fontSize='24px' color={'primary.500'} variant={'noShadow'}>Character Sheets</Heading>
            </Link>
            <Spacer />

            <Box
            mr={10}
            >
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
                          variant='outline'
                          color='whiteAlpha.800'
                          borderColor='primary.500'
                          onClick={openConnectModal}>
                            {/* <Icon as={FaRegTimesCircle} color='raid' /> */}
                              Connect
                          </Button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <Button
                          variant='outline'
                          color='whiteAlpha.800'
                          borderColor='primary.500'
                          onClick={openChainModal}>
                              Wrong network
                          </Button>
                        );
                      }

                      return (
                          <Button
                          variant='outline'
                          color='whiteAlpha.800'
                          borderColor='primary.500'
                          onClick={openAccountModal}>
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
