import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
} from '@chakra-ui/react';

import { EXPERIENCE_TO_LEVEL_MAP, MAX_CLASS_LEVEL } from '@/utils/constants';

type LevelProgressionModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const LevelProgressionModal: React.FC<LevelProgressionModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Modal closeOnEsc closeOnOverlayClick isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent mt={{ base: 0, md: '84px' }}>
        <ModalHeader>
          <VStack alignItems="flex-start">
            <Text textAlign="left" textTransform="initial" fontWeight="500">
              Level Progression
            </Text>
            <Text textTransform="initial" fontSize="xs">
              All class levels start at 1 and can progress to 20.
            </Text>
          </VStack>
          <ModalCloseButton size="lg" />
        </ModalHeader>
        <ModalBody>
          <Table size="sm">
            <Thead>
              <Tr>
                <Th>Experience Points</Th>
                <Th>Level</Th>
              </Tr>
            </Thead>
            <Tbody>
              {Array.from({ length: MAX_CLASS_LEVEL }, (_, i) => i + 1).map(
                level => (
                  <Tr key={`level-progression-${level}`}>
                    <Td color="softyellow">{EXPERIENCE_TO_LEVEL_MAP[level]}</Td>
                    <Td>{level}</Td>
                  </Tr>
                ),
              )}
            </Tbody>
          </Table>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
