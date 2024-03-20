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

const MAX_LEVEL = 20;
const EXPERIENCE_TO_LEVEL_MAP: { [key: number]: number } = {
  // base on D&D 5e
  1: 0,
  2: 300,
  3: 900,
  4: 2700,
  5: 6500,
  6: 14000,
  7: 23000,
  8: 34000,
  9: 48000,
  10: 64000,
  11: 85000,
  12: 100000,
  13: 120000,
  14: 140000,
  15: 165000,
  16: 195000,
  17: 225000,
  18: 265000,
  19: 305000,
  20: 355000,
};

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
              {Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map(level => (
                <Tr key={`level-progression-${level}`}>
                  <Td color="softyellow">{EXPERIENCE_TO_LEVEL_MAP[level]}</Td>
                  <Td>{level}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
