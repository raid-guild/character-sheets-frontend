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
import { ABIS } from './abis';

type WriteParams = WriteContractParameters<Abi, string, readonly unknown[], Chain | undefined>;

export const executeAsCharacter = (
  character: Character,
  walletClient: WalletClient,
  args: Array<
    WriteParams
  > | WriteParams,
): Promise<`0x${string}`> => {

  if (!Array.isArray(args)) {
    args = [args] as Array<WriteParams>;
  }

  const calls = args.map(arg => {
    const data = encodeFunctionData({
      abi: arg.abi,
      functionName: arg.functionName,
      args: arg.args,
    });

    return {
      target: arg.address,
      callData: data,
    };
  });

  const data = encodeFunctionData({
    abi: ABIS.multicall3,
    functionName: 'aggregate',
    args: [calls],
  });

  const to = walletClient.chain?.contracts?.multicall3
    ?.address as `0x${string}`;

  if (!to) {
    throw new Error('Multicall contract address is not found');
  }

  const value = BigInt(0);

  const operation = BigInt(1);

  return walletClient.writeContract({
    chain: walletClient.chain as Chain,
    account: walletClient.account as Account,
    address: character.account as `0x${string}`,
    abi: parseAbi([
      'function execute(address to, uint256 value, bytes calldata data, uint256 operation) external',
    ]),
    functionName: 'execute',
    args: [to, value, data, operation],
  });
};
