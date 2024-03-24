import { CloseIcon } from '@chakra-ui/icons';
import {
  Button,
  FormControl,
  FormHelperText,
  Grid,
  HStack,
  Image,
  Input,
  Link,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getAddress } from 'viem';
import { useAccount } from 'wagmi';

import { useGame } from '@/contexts/GameContext';
import { getAddressUrl } from '@/lib/web3';
import { shortenAddress } from '@/utils/helpers';
import { Character } from '@/utils/types';

import { SelectCharacterInput } from './SelectCharacterInput';

export type WhitelistAddress = {
  address: `0x${string}`;
  amount: bigint;
};

type Props = {
  whitelistAddressList: Array<WhitelistAddress>;
  itemSupply: string;
  itemDistribution: string;
  setWhitelistAddressList: React.Dispatch<
    React.SetStateAction<Array<WhitelistAddress>>
  >;
};

export const WhitelistAddressListInput: React.FC<Props> = ({
  whitelistAddressList,
  itemSupply,
  itemDistribution,
  setWhitelistAddressList,
}) => {
  const { game } = useGame();
  const { chain } = useAccount();

  const { characters, chainId } = game || {
    characters: [],
    chainId: chain?.id,
  };

  const characterMap = useMemo(() => {
    const map = new Map<string, string>();
    characters.forEach(c => map.set(c.account, c.name));
    return map;
  }, [characters]);

  const removeWhitelistAddress = useCallback(
    (index: number) => {
      const newWhitelistAddressList = whitelistAddressList.slice();
      newWhitelistAddressList.splice(index, 1);
      setWhitelistAddressList(newWhitelistAddressList);
    },
    [whitelistAddressList, setWhitelistAddressList],
  );

  const charactersNotSelected = useMemo(() => {
    const selectedAddresses = new Set(
      whitelistAddressList.map(c => c.address.toLowerCase()),
    );
    return characters.filter(c => !selectedAddresses.has(c.account));
  }, [whitelistAddressList, characters]);

  if (!chainId) {
    return (
      <VStack align="stretch" spacing={4} w="100%">
        <Text>You must connect your wallet to add characters.</Text>
      </VStack>
    );
  }

  return (
    <VStack align="stretch" spacing={4} w="100%">
      <Text>Whitelisted characters (if left empty, any player can claim)</Text>
      <WhitelistAddressInput
        characters={charactersNotSelected}
        whitelistAddressList={whitelistAddressList}
        itemSupply={itemSupply}
        itemDistribution={itemDistribution}
        setWhitelistAddressList={setWhitelistAddressList}
      />
      <VStack spacing={2} w="100%">
        {Array(whitelistAddressList.length)
          .fill(0)
          .map((v, i) => (
            <WhitelistAddressDisplay
              key={v.toString() + i.toString()}
              whitelistAddress={whitelistAddressList[i]}
              characterName={characterMap.get(
                whitelistAddressList[i].address.toLowerCase(),
              )}
              removeWhitelistAddress={removeWhitelistAddress}
              index={i}
              chainId={chainId}
            />
          ))}
      </VStack>
    </VStack>
  );
};

type DisplayProps = {
  whitelistAddress: WhitelistAddress;
  characterName: string | undefined;
  removeWhitelistAddress: (index: number) => void;
  index: number;
  chainId: number;
};

const WhitelistAddressDisplay: React.FC<DisplayProps> = ({
  whitelistAddress,
  characterName,
  removeWhitelistAddress,
  index: i,
  chainId,
}) => {
  const { address, amount } = whitelistAddress;

  return (
    <VStack spacing={4} w="100%" mb={4}>
      <Grid
        w="100%"
        templateColumns={{
          base: '2fr 1.5fr',
          sm: '3fr 1.5fr',
          md: '3fr 1fr',
        }}
        gridGap={4}
        position="relative"
      >
        <HStack spacing={2}>
          <Text fontWeight="bold">{characterName}</Text>
          <Link
            alignItems="center"
            color="blue"
            display="flex"
            fontSize="sm"
            gap={2}
            href={getAddressUrl(chainId, address)}
            isExternal
            p={0}
          >
            {shortenAddress(address)}
            <Image
              alt="link to new tab"
              height="14px"
              src="/icons/new-tab.svg"
              width="14px"
            />
          </Link>
        </HStack>
        <Text>{amount.toString()}</Text>
        <CloseIcon
          position="absolute"
          right="0"
          top="50%"
          transform="translateY(-50%)"
          cursor="pointer"
          transition="0.25s"
          color="whiteAlpha.400"
          _hover={{ color: 'white' }}
          onClick={() => removeWhitelistAddress(i)}
        />
      </Grid>
    </VStack>
  );
};

type InputProps = {
  characters: Character[];
  whitelistAddressList: Array<WhitelistAddress>;
  itemSupply: string;
  itemDistribution: string;
  setWhitelistAddressList: React.Dispatch<
    React.SetStateAction<Array<WhitelistAddress>>
  >;
};

const WhitelistAddressInput: React.FC<InputProps> = ({
  characters,
  whitelistAddressList,
  itemSupply,
  itemDistribution,
  setWhitelistAddressList,
}) => {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null,
  );
  const [amount, setAmount] = useState<string>('');
  const [showError, setShowError] = useState<boolean>(false);

  const amountInvalid = useMemo(
    () => !amount || Number.isNaN(Number(amount)) || amount === '0',
    [amount],
  );

  const moreThanSupply = useMemo(() => {
    const totalAmount = whitelistAddressList.reduce(
      (acc, curr) => BigInt(acc) + BigInt(curr.amount),
      BigInt(0),
    );

    if (totalAmount + BigInt(amount) > BigInt(itemSupply)) {
      return true;
    }
    return false;
  }, [amount, whitelistAddressList, itemSupply]);

  const moreThanDistribution = useMemo(() => {
    if (BigInt(amount) > BigInt(itemDistribution)) {
      return true;
    }
    return false;
  }, [amount, itemDistribution]);

  useEffect(() => {
    setShowError(false);
  }, [selectedCharacter, amount]);

  const errorText = useMemo(() => {
    if (!selectedCharacter && amountInvalid) {
      return 'Character and amount are invalid';
    }
    if (!selectedCharacter && !amountInvalid) {
      return 'Character is invalid';
    }
    if (selectedCharacter && amountInvalid) {
      return 'Amount is invalid';
    }
    if (!!selectedCharacter && moreThanSupply) {
      return 'Total whitelist amount exceeds item supply';
    }
    if (!!selectedCharacter && moreThanDistribution) {
      return 'Whitelist amount exceeds item distribution';
    }
    return '';
  }, [selectedCharacter, amountInvalid, moreThanSupply, moreThanDistribution]);

  const onAddWhitelistAddress = useCallback(() => {
    if (
      !selectedCharacter ||
      amountInvalid ||
      moreThanSupply ||
      moreThanDistribution
    ) {
      setShowError(true);
      return;
    }

    setWhitelistAddressList(oldList => [
      ...oldList,
      {
        address: getAddress(selectedCharacter.account),
        amount: BigInt(amount),
      },
    ]);
    setSelectedCharacter(null);
    setAmount('');
    setShowError(false);
  }, [
    amount,
    selectedCharacter,
    amountInvalid,
    moreThanSupply,
    moreThanDistribution,
    setWhitelistAddressList,
  ]);

  return (
    <VStack spacing={4} w="100%" mb={4}>
      <FormControl>
        <Grid
          w="100%"
          templateColumns={{
            base: '1fr',
            sm: '3fr 1.5fr',
            md: '3fr 1fr',
          }}
          gridGap={4}
          position="relative"
          justifyContent="center"
          alignItems="center"
        >
          <SelectCharacterInput
            characters={characters}
            selectedCharacter={selectedCharacter}
            setSelectedCharacter={setSelectedCharacter}
          />
          <Tooltip
            label={characters.length === 0 ? 'No characters available' : ''}
          >
            <Input
              type="number"
              step={1}
              min={0}
              placeholder="Amount"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              isInvalid={amountInvalid && showError}
              isDisabled={characters.length === 0}
              h="2.7125rem"
            />
          </Tooltip>
        </Grid>
        {showError && (
          <FormHelperText color="red.500">{errorText}</FormHelperText>
        )}
      </FormControl>
      <Tooltip label={characters.length === 0 ? 'No characters available' : ''}>
        <Button
          variant="outline"
          size="sm"
          onClick={onAddWhitelistAddress}
          isDisabled={characters.length === 0}
        >
          Add character
        </Button>
      </Tooltip>
    </VStack>
  );
};
