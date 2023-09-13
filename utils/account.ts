import {
  Abi,
  Account,
  Chain,
  encodeFunctionData,
  parseAbi,
  WalletClient,
  WriteContractParameters,
} from 'viem';

import { Character } from './types';

export const executeAsCharacter = (
  character: Character,
  walletClient: WalletClient,
  args: WriteContractParameters<Abi, string, Chain, Account, Chain>,
): Promise<`0x${string}`> => {
  const data = encodeFunctionData({
    abi: args.abi,
    functionName: args.functionName,
    args: args.args,
  });

  const to = args.address;

  const value = BigInt(0);

  const operation = BigInt(0);

  return walletClient.writeContract({
    chain: args.chain,
    account: args.account as Account,
    address: character.account as `0x${string}`,
    abi: parseAbi([
      'function execute(address to, uint256 value, bytes calldata data, uint256 operation) external',
    ]),
    functionName: 'execute',
    args: [to, value, data, operation],
  });
};
