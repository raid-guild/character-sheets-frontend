import {
  Box,
  HStack,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
} from '@chakra-ui/react';
import { useMemo } from 'react';

import { EXPERIENCE_TO_LEVEL_MAP } from '@/utils/constants';
import { HeldClass } from '@/utils/types';

type HeldClassesInfoModalProps = {
  heldClass: HeldClass;
  isOpen: boolean;
  onClose: () => void;
};

export const HeldClassesInfoModal: React.FC<HeldClassesInfoModalProps> = ({
  heldClass,
  isOpen,
  onClose,
}) => {
  const { description, experience, image, level, name } = heldClass;

  const nextLevelXpRequirement = useMemo(() => {
    return EXPERIENCE_TO_LEVEL_MAP[Number(level) + 1];
  }, [level]);

  const xpUntilNextLevel = useMemo(() => {
    return nextLevelXpRequirement - Number(experience);
  }, [experience, nextLevelXpRequirement]);

  return (
    <Modal closeOnEsc closeOnOverlayClick isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent
        mt={{ base: 0, md: '84px' }}
        minW={{ base: '100%', md: '600px' }}
      >
        <ModalHeader>
          <Text textAlign="left" textTransform="initial" fontWeight="500">
            {name} - Level {level}
          </Text>
          <ModalCloseButton size="lg" />
        </ModalHeader>
        <ModalBody>
          <HStack gap={8} mb={8}>
            <Image
              alt="class emblem"
              h="100px"
              objectFit="contain"
              src={image}
              w="100px"
            />
            <Text textAlign="left" textTransform="initial">
              {description}
            </Text>
          </HStack>
          <Text textAlign="left" mb={4} fontSize="sm" textTransform="initial">
            <Text as="span" color="softyellow" fontWeight={500}>
              {xpUntilNextLevel} XP
            </Text>{' '}
            is required to reach level {Number(level) + 1}
          </Text>
          <Box bg="gray.200" h="8px" mb="8px" overflow="hidden" w="100%">
            <Box
              bg="softyellow"
              h="100%"
              style={{
                width: `${(Number(experience) / nextLevelXpRequirement) * 100}%`,
              }}
            />
          </Box>
          <HStack justify="space-between">
            <Text fontSize="xs" textAlign="left" textTransform="initial">
              Current XP: {experience}
            </Text>
            <Text fontSize="xs" textAlign="right" textTransform="initial">
              Next level: 300
            </Text>
          </HStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
