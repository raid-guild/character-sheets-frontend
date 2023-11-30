import {
  Flex,
  HStack,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react';

import { useGame } from '@/contexts/GameContext';
import { Class } from '@/utils/types';

import { ClassCard } from '../ClassCard';

type ClassesModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const ClassesModal: React.FC<ClassesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { game } = useGame();

  const classes: Class[] = game?.classes || [];

  return (
    <Modal closeOnEsc closeOnOverlayClick isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent mt={{ base: 0, md: '84px' }}>
        <ModalHeader>
          <Flex flexDir={{ base: 'column', md: 'row' }} gap={4}>
            <Text textAlign="left" textTransform="initial" fontWeight="500">
              {game?.name}
            </Text>
            <HStack>
              <Image
                alt="classes"
                height="20px"
                src="/icons/users.svg"
                width="20px"
              />
              <Text
                letterSpacing="3px"
                fontSize="2xs"
                textTransform="uppercase"
              >
                Classes ({classes.length})
              </Text>
            </HStack>
          </Flex>
          <ModalCloseButton size="lg" />
        </ModalHeader>
        <ModalBody>
          <VStack spacing={6} w="100%">
            {game &&
              classes.length > 0 &&
              classes.map(_class => (
                <ClassCard key={_class.id} chainId={game.chainId} {..._class} />
              ))}
            {classes.length === 0 && (
              <Text align="center">No classes found.</Text>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
