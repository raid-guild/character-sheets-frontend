import { SimpleGrid, Text, VStack } from '@chakra-ui/react';

import { SmallCharacterCard } from '@/components/CharacterCard';
import { Character } from '@/utils/types';

export const CharactersPanel: React.FC<{
  chainId: number;
  characters: Character[];
  isMaster: boolean;
}> = ({ chainId, characters, isMaster }) => {
  if (characters.length > 0) {
    return (
      <SimpleGrid columns={2} spacing={4} w="100%">
        {characters.map(c => (
          <SmallCharacterCard
            key={c.id}
            {...c}
            chainId={chainId}
            isMaster={isMaster}
          />
        ))}
      </SimpleGrid>
    );
  }
  return (
    <VStack as="main" pt={20}>
      <Text align="center">No characters found.</Text>
    </VStack>
  );
};
