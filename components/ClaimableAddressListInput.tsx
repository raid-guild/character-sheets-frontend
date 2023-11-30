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
import { useNetwork } from 'wagmi';

import { useGame } from '@/contexts/GameContext';
import { getAddressUrl } from '@/lib/web3';
import { shortenAddress } from '@/utils/helpers';
import { Character } from '@/utils/types';

import { SelectCharacterInput } from './SelectCharacterInput';

export type ClaimableAddress = {
  address: `0x${string}`;
  amount: bigint;
};

type Props = {
  claimableAddressList: Array<ClaimableAddress>;
  itemSupply: string;
  itemDistribution: string;
  setClaimableAddressList: React.Dispatch<
    React.SetStateAction<Array<ClaimableAddress>>
  >;
};

export const ClaimableAddressListInput: React.FC<Props> = ({
  claimableAddressList,
  itemSupply,
  itemDistribution,
  setClaimableAddressList,
}) => {
  const { game } = useGame();
  const { chain } = useNetwork();

  const { characters, chainId } = game || {
    characters: [],
    chainId: chain?.id,
  };

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

  if (!chainId) {
    return (
      <VStack align="stretch" spacing={4} w="100%">
        <Text>You must connect your wallet to add claimers.</Text>
      </VStack>
    );
  }

  return (
    <VStack align="stretch" spacing={4} w="100%">
      <Text>Whitelisted claimers (if left empty, any player can claim)</Text>
      <ClaimableAddressInput
        characters={charactersNotSelected}
        claimableAddressList={claimableAddressList}
        itemSupply={itemSupply}
        itemDistribution={itemDistribution}
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
              chainId={chainId}
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
  chainId: number;
};

const ClaimableAddressDisplay: React.FC<DisplayProps> = ({
  claimableAddress,
  characterName,
  removeClaimableAddress,
  index: i,
  chainId,
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
  itemDistribution: string;
  setClaimableAddressList: React.Dispatch<
    React.SetStateAction<Array<ClaimableAddress>>
  >;
};

const ClaimableAddressInput: React.FC<InputProps> = ({
  characters,
  claimableAddressList,
  itemSupply,
  itemDistribution,
  setClaimableAddressList,
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
    const totalAmount = claimableAddressList.reduce(
      (acc, curr) => BigInt(acc) + BigInt(curr.amount),
      BigInt(0),
    );

    if (totalAmount + BigInt(amount) > BigInt(itemSupply)) {
      return true;
    }
    return false;
  }, [amount, claimableAddressList, itemSupply]);

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
      return 'Total claimable amount exceeds item supply';
    }
    if (!!selectedCharacter && moreThanDistribution) {
      return 'Claimable amount exceeds item distribution';
    }
    return '';
  }, [selectedCharacter, amountInvalid, moreThanSupply, moreThanDistribution]);

  const onAddClaimableAddress = useCallback(() => {
    if (
      !selectedCharacter ||
      amountInvalid ||
      moreThanSupply ||
      moreThanDistribution
    ) {
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
    moreThanDistribution,
    setClaimableAddressList,
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
          <FormHelperText color="red.500">{errorText}</FormHelperText>
        )}
      </FormControl>
      <Button variant="outline" size="sm" onClick={onAddClaimableAddress}>
        Add claimer
      </Button>
    </VStack>
  );
};
