import { Button, Flex, Heading, Text, VStack } from '@chakra-ui/react';
import NextLink from 'next/link';
import { zeroAddress } from 'viem';
import { useAccount } from 'wagmi';

import { CharacterCard } from '@/components/CharacterCard';
import { CreateGameModal } from '@/components/Modals/CreateGameModal';
import { useGamesContext } from '@/contexts/GamesContext';
import { useToast } from '@/hooks/useToast';
import { SUPPORTED_CHAINS } from '@/lib/web3';
import { Character, Class, EquippedItem, Item } from '@/utils/types';

const createDummyClass = (name: string): Class => ({
  id: '',
  classId: '',
  uri: '',
  name,
  description: '',
  image: '',
  holders: [],
  claimable: false,
});

const createDummyItem = (name: string, image: string): Item => ({
  id: '',
  itemId: '',
  uri: '',
  name,
  description: '',
  image,
  soulbound: false,
  supply: BigInt(0),
  totalSupply: BigInt(0),
  amount: BigInt(2),
  requirements: [],
  holders: [{ id: '1', characterId: '1' }],
  equippers: [{ id: '1', characterId: '1' }],
  merkleRoot: '',
});

const dummyCharacter: Character = {
  id: '1',
  name: 'McLizard the Hizard',
  description: 'A lizard wizard',
  image: '/RG_CharacterSheet_CharacterBuild__v3_ex2.png',
  characterId: '1',
  account: '0x1234567890123456789012345678901234567890',
  player: '0x1234567890123456789012345678901234567890',
  jailed: false,
  removed: false,
  approved: zeroAddress,
  experience: '28930',
  uri: '',
  heldItems: [
    createDummyItem('Sword of Undhur', '/sword.png'),
    createDummyItem('Wooden Staff', '/staff.png'),
  ],
  equippedItems: [
    createDummyItem('Sword of Undhur', '/sword.png') as EquippedItem,
    createDummyItem('Wooden Staff', '/staff.png') as EquippedItem,
  ],
  classes: [createDummyClass('Wizard'), createDummyClass('Warrior')],
};

export default function Home(): JSX.Element {
  const { createGameModal } = useGamesContext();
  const { address } = useAccount();
  const { renderError } = useToast();

  return (
    <Flex
      backgroundImage="url('/RG_CS_bg.png')"
      backgroundPosition="0 -20vh"
      backgroundRepeat="no-repeat"
      backgroundSize="100%"
      direction="column"
      py="100px"
      px={{ base: 4, lg: '10vw' }}
    >
      <VStack spacing={0} align="start" maxW="100rem" w="100%" mx="auto">
        <Heading
          fontSize="66px"
          lineHeight="56px"
          maxW="720px"
          textTransform="capitalize"
        >
          Eternalize your journey
        </Heading>
        <Text fontSize={{ base: 'lg', lg: 'md' }} mt="10" maxW="520px" w="full">
          Build your character as a live chronicle of your actions. Collect
          items, earn XP and level up classes to register your growth on-chain.
        </Text>
        <Flex
          direction={{ base: 'column', lg: 'row' }}
          mt="10"
          mx={{ base: 'auto', lg: '0' }}
        >
          <Button
            as={NextLink}
            href="/all-games"
            mr={{ base: '0', lg: '15px' }}
            size="lg"
            variant="solid"
          >
            Browse games
          </Button>
          <Button
            onClick={() => {
              if (!address) {
                renderError('Please connect your wallet first');
                return;
              }
              createGameModal?.onOpen();
            }}
            size="lg"
            mt={{ base: '10px', lg: '0' }}
          >
            Create game
          </Button>
        </Flex>
        <Text
          color="whiteAlpha.700"
          fontSize="14px"
          mt={20}
          mb={6}
          textTransform="uppercase"
        >
          Most recent :
        </Text>

        <CharacterCard
          character={dummyCharacter}
          chainId={SUPPORTED_CHAINS[0].id}
          dummy
        />
      </VStack>

      {createGameModal && <CreateGameModal />}
    </Flex>
  );
}
