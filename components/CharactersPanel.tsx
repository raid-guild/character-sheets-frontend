import { Text, VStack, Wrap, WrapItem } from '@chakra-ui/react';

import { CharacterCardSmall } from '@/components/CharacterCard';
import { useGame } from '@/contexts/GameContext';
import { DEFAULT_CHAIN } from '@/lib/web3';

export const CharactersPanel: React.FC = () => {
  const { game } = useGame();

  const characters = game?.characters.filter(c => !c.removed) ?? [];

  if (characters.length > 0) {
    return (
      <Wrap spacing={6} w="100%">
        {characters.map(c => (
          <WrapItem key={c.id}>
            <CharacterCardSmall chainId={DEFAULT_CHAIN.id} character={c} />
          </WrapItem>
        ))}
      </Wrap>
    );
  }
  return (
    <VStack as="main" pt={20}>
      <Text align="center">No characters found.</Text>
    </VStack>
  );
};
