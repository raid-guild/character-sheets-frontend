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
import { getAddress, isAddress } from 'viem';

import { useGame } from '@/contexts/GameContext';
import { DEFAULT_CHAIN } from '@/lib/web3';
import { EXPLORER_URLS } from '@/utils/constants';
import { shortenAddress } from '@/utils/helpers';

const getExplorerUrl = (address: string) => {
  return `${EXPLORER_URLS[DEFAULT_CHAIN.id]}/address/${address}`;
};

export type ClaimableAddress = {
  address: `0x${string}`;
  amount: bigint;
};

type Props = {
  claimableAddressList: Array<ClaimableAddress>;
  setClaimableAddressList: React.Dispatch<
    React.SetStateAction<Array<ClaimableAddress>>
  >;
};

export const ClaimableAddressListInput: React.FC<Props> = ({
  claimableAddressList,
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

  return (
    <VStack align="stretch" spacing={4} w="100%">
      <Text>Whitelisted claimers (if left empty, any player can claim)</Text>
      <ClaimableAddressInput
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
  setClaimableAddressList: React.Dispatch<
    React.SetStateAction<Array<ClaimableAddress>>
  >;
};

const ClaimableAddressInput: React.FC<InputProps> = ({
  setClaimableAddressList,
}) => {
  const [address, setAddress] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [showError, setShowError] = useState<boolean>(false);

  const addressInvalid = useMemo(() => !isAddress(address), [address]);
  const amountInvalid = useMemo(
    () => !amount || Number.isNaN(Number(amount)),
    [amount],
  );

  useEffect(() => {
    setShowError(false);
  }, [address, amount]);

  const onAddClaimableAddress = useCallback(() => {
    if (addressInvalid || amountInvalid) {
      setShowError(true);
      return;
    }

    setClaimableAddressList(oldList => [
      ...oldList,
      { address: getAddress(address), amount: BigInt(amount) },
    ]);
    setAddress('');
    setAmount('');
    setShowError(false);
  }, [address, amount, addressInvalid, amountInvalid, setClaimableAddressList]);

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
          <Input
            value={address}
            placeholder="Address"
            isInvalid={addressInvalid && showError}
            onChange={e => setAddress(e.target.value)}
            maxLength={42}
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
            {addressInvalid &&
              amountInvalid &&
              'Address and amount are invalid'}
            {addressInvalid && !amountInvalid && 'Address is invalid'}
            {!addressInvalid && amountInvalid && 'Amount is invalid'}
          </FormHelperText>
        )}
      </FormControl>
      <Button variant="outline" size="sm" onClick={onAddClaimableAddress}>
        Add claimer
      </Button>
    </VStack>
  );
};
