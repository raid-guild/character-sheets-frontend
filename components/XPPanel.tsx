import {
  Button,
  Flex,
  Image,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { useMemo } from 'react';

import { useGame } from '@/contexts/GameContext';

export const XPPanel: React.FC = () => {
  const { game } = useGame();
  const toast = useToast();

  const sortedCharacters = useMemo(
    () =>
      game?.characters.sort(
        (a, b) => Number(b.experience) - Number(a.experience),
      ) ?? [],
    [game?.characters],
  );

  if (!game || Number(game.experience) === 0) {
    return (
      <VStack as="main" py={20}>
        <Text align="center">No XP has been given in this game.</Text>
      </VStack>
    );
  }

  return (
    <VStack as="main" py={10} w="100%">
      <TableContainer w="100%">
        <Table>
          <Thead>
            <Tr>
              <Th>
                <Text color="white">Character</Text>
              </Th>
              <Th>
                <Text color="white">XP</Text>
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {sortedCharacters.map(c => (
              <Tr key={`xp-panel-${c.id}`}>
                <Td alignItems="center" display="flex" gap={2}>
                  <Button
                    onClick={() =>
                      toast({
                        title: 'Coming soon!',
                        position: 'top',
                        status: 'warning',
                      })
                    }
                    size="sm"
                  >
                    View
                  </Button>
                  <Flex alignItems="center" gap={2}>
                    <Image
                      alt="character avatar"
                      borderRadius="full"
                      height="32px"
                      objectFit="contain"
                      src={c.image}
                      width="32px"
                    />
                    <Text>{c.name}</Text>
                  </Flex>
                </Td>
                <Td>{c.experience}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </VStack>
  );
};
