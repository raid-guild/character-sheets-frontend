import { CloseIcon, HamburgerIcon } from '@chakra-ui/icons';
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  Flex,
  Heading,
  IconButton,
  useBreakpointValue,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { useEffect } from 'react';

import { ActiveLink } from '@/components/ActiveLink';

import { ConnectWalletButton } from './ConnectWalletButton';

export const NavMenu: React.FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const isDesktop = useBreakpointValue({ base: false, lg: true });

  useEffect(() => {
    if (isDesktop) {
      onClose();
    }
  }, [isDesktop, onClose]);

  return (
    <>
      <Flex
        as="nav"
        align="center"
        gap={4}
        mr={4}
        display={{ base: 'none', lg: 'flex' }}
      >
        <ActiveLink href="/my-games">My games</ActiveLink>
        <ActiveLink href="/all-games">All games</ActiveLink>
        <ConnectWalletButton />
      </Flex>
      <IconButton
        aria-label="Open menu"
        display={{ base: 'flex', lg: 'none' }}
        icon={<HamburgerIcon width="3rem" height="2rem" />}
        size="lg"
        onClick={onOpen}
        variant="ghost"
      />
      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerContent bg="dark" maxW="100%">
          <DrawerHeader px={4} py={2}>
            <Flex
              align="center"
              justify="space-between"
              w="100%"
              borderBottom="1px solid white"
              pb={4}
              pt={4}
            >
              <Heading fontSize="22px" textTransform="uppercase" ml={2}>
                CharacterSheets
              </Heading>
              <IconButton
                aria-label="Close menu"
                icon={<CloseIcon width="1.5rem" height="1.5rem" />}
                onClick={onClose}
                variant="ghost"
                py={2}
                h="2rem"
              />
            </Flex>
          </DrawerHeader>

          <DrawerBody>
            <VStack w="100%" spacing={6} py={6}>
              <ActiveLink href="/my-games" onClick={onClose}>
                My games
              </ActiveLink>
              <ActiveLink href="/all-games" onClick={onClose}>
                All games
              </ActiveLink>
              <ConnectWalletButton />
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};
