import { decodeAbiParameters, encodeAbiParameters, zeroAddress } from 'viem';

import {
  ClaimRequirementsInput,
  validateNode,
} from '@/components/ClaimRequirementsInput';
import { CraftItemRequirementsListInput } from '@/components/CraftItemRequirementsListInput';
import { Switch } from '@/components/Switch';
import { useGame } from '@/contexts/GameContext';
import { useToast } from '@/hooks/useToast';
import { CraftRequirement, RequirementNode } from '@/utils/types';

const EMPTY_CLAIM_REQUIREMENTS_BYTES =
  '0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;

const EMPTY_CRAFT_REQUIREMENTS_BYTES =
  '0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;

const encodeOperator = (operator: 'NIL' | 'AND' | 'OR' | 'NOT'): number => {
  switch (operator) {
    case 'NIL':
      return 0;
    case 'AND':
      return 1;
    case 'OR':
      return 2;
    case 'NOT':
      return 3;
    default:
      throw new Error(`Invalid operator: ${operator}`);
  }
};

const encodeCategory = (category: 'ERC20' | 'ERC721' | 'ERC1155'): number => {
  switch (category) {
    case 'ERC20':
      return 0;
    case 'ERC721':
      return 1;
    case 'ERC1155':
      return 2;
    default:
      throw new Error(`Invalid category: ${category}`);
  }
};

export const encodeRequirementNode = (
  node: RequirementNode | null,
): `0x${string}` => {
  if (!node) {
    return '0x';
  }

  const children: Array<`0x${string}`> =
    node.children.filter(n => !!n).map(child => encodeRequirementNode(child)) ??
    [];

  const operator = encodeOperator(node.operator);

  const asset = node.asset
    ? {
        category: encodeCategory(node.asset.assetCategory),
        assetAddress: node.asset.assetAddress as `0x${string}`,
        id: BigInt(node.asset.assetId),
        amount: BigInt(node.asset.amount),
      }
    : {
        category: 0,
        assetAddress: zeroAddress,
        id: BigInt(0),
        amount: BigInt(0),
      };

  return encodeAbiParameters(
    [
      { name: 'operator', type: 'uint8' },
      {
        name: 'asset',
        type: 'tuple',
        components: [
          { name: 'category', type: 'uint8' },
          { name: 'assetAddress', type: 'address' },
          { name: 'id', type: 'uint256' },
          { name: 'amount', type: 'uint256' },
        ],
      },
      { name: 'children', type: 'bytes[]' },
    ],
    [operator, asset, children],
  );
};

const decodeOperator = (operator: number): 'NIL' | 'AND' | 'OR' | 'NOT' => {
  switch (operator) {
    case 0:
      return 'NIL';
    case 1:
      return 'AND';
    case 2:
      return 'OR';
    case 3:
      return 'NOT';
    default:
      throw new Error(`Invalid operator: ${operator}`);
  }
};

const decodeCategory = (category: number): 'ERC20' | 'ERC721' | 'ERC1155' => {
  switch (category) {
    case 0:
      return 'ERC20';
    case 1:
      return 'ERC721';
    case 2:
      return 'ERC1155';
    default:
      throw new Error(`Invalid category: ${category}`);
  }
};

export const decodeRequirementNode = (
  bytes: `0x${string}`,
): RequirementNode | null => {
  if (!bytes || bytes === '0x' || bytes === EMPTY_CLAIM_REQUIREMENTS_BYTES) {
    return null;
  }
  const decoded = decodeAbiParameters(
    [
      { name: 'operator', type: 'uint8' },
      {
        name: 'asset',
        type: 'tuple',
        components: [
          { name: 'category', type: 'uint8' },
          { name: 'assetAddress', type: 'address' },
          { name: 'id', type: 'uint256' },
          { name: 'amount', type: 'uint256' },
        ],
      },
      { name: 'children', type: 'bytes[]' },
    ],
    bytes,
  );

  const node = {
    operator: decoded[0],
    asset: decoded[1],
    children: decoded[2],
  };

  const operator = decodeOperator(node.operator);

  const asset = {
    assetCategory: decodeCategory(node.asset.category),
    assetAddress: node.asset.assetAddress,
    assetId: node.asset.id.toString(),
    amount: node.asset.amount.toString(),
  };

  return {
    operator,
    asset,
    children: node.children
      .map(child => decodeRequirementNode(child))
      .filter(n => !!n) as RequirementNode[],
  };
};

export const encodeCraftRequirements = (
  craftRequirements: CraftRequirement[],
): `0x${string}` => {
  const craftRequirementsBytes = encodeAbiParameters(
    [
      {
        components: [
          { name: 'itemId', type: 'uint256' },
          { name: 'amount', type: 'uint256' },
        ],
        name: 'CraftItem',
        type: 'tuple[]',
      },
    ],
    [
      craftRequirements
        .sort((a, b) => Number(BigInt(a.itemId) - BigInt(b.itemId)))
        .map(({ itemId, amount }) => ({
          itemId: BigInt(itemId),
          amount: BigInt(amount),
        })),
    ],
  );

  return craftRequirementsBytes;
};

export const decodeCraftRequirements = (
  craftRequirementsBytes: `0x${string}`,
): CraftRequirement[] => {
  if (
    !craftRequirementsBytes ||
    craftRequirementsBytes === '0x' ||
    craftRequirementsBytes === EMPTY_CRAFT_REQUIREMENTS_BYTES
  ) {
    return [];
  }

  const decodedCraftRequirements = decodeAbiParameters(
    [
      {
        components: [
          { name: 'itemId', type: 'uint256' },
          { name: 'amount', type: 'uint256' },
        ],
        name: 'CraftItem',
        type: 'tuple[]',
      },
    ],
    craftRequirementsBytes,
  );

  return decodedCraftRequirements[0].map(({ itemId, amount }) => ({
    itemId: itemId.toString(),
    amount: amount.toString(),
  }));
};
