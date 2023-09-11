import { SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { useNetwork } from 'wagmi';

import { SmallCharacterCard } from '@/components/CharacterCard';
import { useGame } from '@/contexts/GameContext';
import { DEFAULT_CHAIN } from '@/lib/web3';

export const CharactersPanel: React.FC = () => {
  const { chain } = useNetwork();
  const { game } = useGame();

  const chainId = chain?.id ?? DEFAULT_CHAIN.id;
  const characters = game?.characters ?? [];

  if (characters.length > 0) {
    return (
      <SimpleGrid columns={2} spacing={4} w="100%">
        {characters.map(c => (
          <SmallCharacterCard key={c.id} chainId={chainId} character={c} />
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
