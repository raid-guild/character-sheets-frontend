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
  VStack,
} from '@chakra-ui/react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getAddress } from 'viem';

import { useGame } from '@/contexts/GameContext';
import { DEFAULT_CHAIN } from '@/lib/web3';
import { EXPLORER_URLS } from '@/utils/constants';
import { shortenAddress } from '@/utils/helpers';
import { Character } from '@/utils/types';

import { SelectCharacterInput } from './SelectCharacterInput';

const getExplorerUrl = (address: string) => {
  return `${EXPLORER_URLS[DEFAULT_CHAIN.id]}/address/${address}`;
};

export type ClaimableAddress = {
  address: `0x${string}`;
  amount: bigint;
};

type Props = {
  claimableAddressList: Array<ClaimableAddress>;
  itemSupply: string;
  setClaimableAddressList: React.Dispatch<
    React.SetStateAction<Array<ClaimableAddress>>
  >;
};

export const ClaimableAddressListInput: React.FC<Props> = ({
  claimableAddressList,
  itemSupply,
  setClaimableAddressList,
}) => {
  const { game } = useGame();

  const { characters } = game || { characters: [] };

  const characterMap = useMemo(() => {
    const map = new Map<string, string>();
    characters.forEach(c => map.set(c.account, c.name));
    return map;
  }, [characters]);

  const removeClaimableAddress = useCallback(
    (index: number) => {
      const newClaimableAddressList = claimableAddressList.slice();
      newClaimableAddressList.splice(index, 1);
      setClaimableAddressList(newClaimableAddressList);
    },
    [claimableAddressList, setClaimableAddressList],
  );

  const charactersNotSelected = useMemo(() => {
    const selectedAddresses = new Set(
      claimableAddressList.map(c => c.address.toLowerCase()),
    );
    return characters.filter(c => !selectedAddresses.has(c.account));
  }, [claimableAddressList, characters]);

  return (
    <VStack align="stretch" spacing={4} w="100%">
      <Text>Whitelisted claimers (if left empty, any player can claim)</Text>
      <ClaimableAddressInput
        characters={charactersNotSelected}
        claimableAddressList={claimableAddressList}
        itemSupply={itemSupply}
        setClaimableAddressList={setClaimableAddressList}
      />
      <VStack spacing={2} w="100%">
        {Array(claimableAddressList.length)
          .fill(0)
          .map((v, i) => (
            <ClaimableAddressDisplay
              key={v.toString() + i.toString()}
              claimableAddress={claimableAddressList[i]}
              characterName={characterMap.get(
                claimableAddressList[i].address.toLowerCase(),
              )}
              removeClaimableAddress={removeClaimableAddress}
              index={i}
            />
          ))}
      </VStack>
    </VStack>
  );
};

type DisplayProps = {
  claimableAddress: ClaimableAddress;
  characterName: string | undefined;
  removeClaimableAddress: (index: number) => void;
  index: number;
};

const ClaimableAddressDisplay: React.FC<DisplayProps> = ({
  claimableAddress,
  characterName,
  removeClaimableAddress,
  index: i,
}) => {
  const { address, amount } = claimableAddress;

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
            href={getExplorerUrl(address)}
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
          right="-2rem"
          top="50%"
          transform="translateY(-50%)"
          cursor="pointer"
          transition="0.25s"
          color="blackAlpha.500"
          _hover={{ color: 'black' }}
          onClick={() => removeClaimableAddress(i)}
        />
      </Grid>
    </VStack>
  );
};

type InputProps = {
  characters: Character[];
  claimableAddressList: Array<ClaimableAddress>;
  itemSupply: string;
  setClaimableAddressList: React.Dispatch<
    React.SetStateAction<Array<ClaimableAddress>>
  >;
};

const ClaimableAddressInput: React.FC<InputProps> = ({
  characters,
  claimableAddressList,
  itemSupply,
  setClaimableAddressList,
}) => {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null,
  );
  const [amount, setAmount] = useState<string>('');
  const [showError, setShowError] = useState<boolean>(false);

  const amountInvalid = useMemo(
    () => !amount || Number.isNaN(Number(amount)),
    [amount],
  );

  const moreThanSupply = useMemo(() => {
    const totalAmount = claimableAddressList.reduce(
      (acc, curr) => acc + curr.amount,
      BigInt(0),
    );
    if (totalAmount + BigInt(amount) > BigInt(itemSupply)) {
      return true;
    }
    return false;
  }, [amount, claimableAddressList, itemSupply]);

  useEffect(() => {
    setShowError(false);
  }, [selectedCharacter, amount]);

  const onAddClaimableAddress = useCallback(() => {
    if (!selectedCharacter || amountInvalid || moreThanSupply) {
      setShowError(true);
      return;
    }

    setClaimableAddressList(oldList => [
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
    setClaimableAddressList,
  ]);

  return (
    <VStack spacing={4} w="100%" mb={4}>
      <FormControl>
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
          <SelectCharacterInput
            characters={characters}
            selectedCharacter={selectedCharacter}
            setSelectedCharacter={setSelectedCharacter}
          />
          <Input
            type="number"
            step={1}
            min={0}
            placeholder="Amount"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            isInvalid={amountInvalid && showError}
          />
        </Grid>
        {showError && (
          <FormHelperText color="red.500">
            {!selectedCharacter &&
              amountInvalid &&
              'Character and amount are invalid'}
            {!selectedCharacter && !amountInvalid && 'Character is invalid'}
            {selectedCharacter && amountInvalid && 'Amount is invalid'}
            {!!selectedCharacter &&
              moreThanSupply &&
              'Total claimable amount exceeds item supply'}
          </FormHelperText>
        )}
      </FormControl>
      <Button variant="outline" size="sm" onClick={onAddClaimableAddress}>
        Add claimer
      </Button>
    </VStack>
  );
};
