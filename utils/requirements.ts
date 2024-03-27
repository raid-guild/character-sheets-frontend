import { decodeAbiParameters, encodeAbiParameters, zeroAddress } from 'viem';

import {
  Character,
  CraftRequirement,
  Game,
  RequirementNode,
} from '@/utils/types';

const EMPTY_CLAIM_REQUIREMENTS_BYTES =
  '0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;

const EMPTY_CRAFT_REQUIREMENTS_BYTES =
  '0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;

export const validateNode = (
  node: RequirementNode | null,
  game: Game | null | undefined,
): boolean => {
  if (!node || !game) return false;

  if (node.operator === 'NIL') {
    if (!node.asset) return false;
    if (
      !node.asset.assetAddress ||
      node.asset.assetAddress === '0x0' ||
      node.asset.assetAddress === zeroAddress
    )
      return false;
    if (!node.asset.assetId) return false;
    if (!node.asset.amount || node.asset.amount === '0') return false;
    if (node.asset.assetCategory === 'ERC1155') {
      if (
        node.asset.assetAddress.toLowerCase() ===
          game.itemsAddress.toLowerCase() &&
        game.items.find(i => i.itemId === node.asset?.assetId)
      ) {
        return true;
      }
      if (
        node.asset.assetAddress.toLowerCase() ===
          game.classesAddress.toLowerCase() &&
        game.classes.find(c => c.classId === node.asset?.assetId)
      ) {
        return true;
      }
      return false;
    }
    if (
      node.asset.assetCategory === 'ERC20' &&
      node.asset.assetAddress.toLowerCase() ===
        game.experienceAddress.toLowerCase()
    ) {
      return true;
    }
    return false;
  }

  if (node.operator === 'AND' || node.operator === 'OR') {
    if (!node.children) return false;
    if (node.children.length === 0) return false;
    if (!!node.asset) return false;
    if (!node.children.every(n => validateNode(n, game))) return false;
    return true;
  }

  if (node.operator === 'NOT') {
    if (!node.children) return false;
    if (node.children.length !== 1) return false;
    if (!!node.asset) return false;
    if (!validateNode(node.children[0], game)) return false;
    return true;
  }

  return false;
};

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

  let asset: RequirementNode['asset'] = {
    assetCategory: decodeCategory(node.asset.category),
    assetAddress: node.asset.assetAddress,
    assetId: node.asset.id.toString(),
    amount: node.asset.amount.toString(),
  };

  if (
    asset.assetCategory === 'ERC20' &&
    asset.assetAddress === zeroAddress &&
    asset.assetId === '0' &&
    asset.amount === '0'
  ) {
    asset = null;
  }

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

export const checkCraftRequirements = (
  craftRequirements: CraftRequirement[],
  character: Character,
  craftableAmount: bigint,
): boolean => {
  return craftRequirements.every(({ itemId, amount }) => {
    const characterItem = character.heldItems.find(
      item =>
        item.itemId === itemId &&
        BigInt(item.amount) >= BigInt(amount) * craftableAmount,
    );
    return !!characterItem;
  });
};

export const checkClaimRequirements = (
  node: RequirementNode | null,
  game: Game,
  character: Character,
): boolean => {
  if (!node || !validateNode(node, game)) {
    return false;
  }

  if (node.operator === 'NIL') {
    if (!node.asset) {
      return false;
    }
    const item =
      node.asset.assetCategory === 'ERC1155' &&
      node.asset.assetAddress.toLowerCase() === game.itemsAddress.toLowerCase()
        ? character.heldItems.find(item => item.itemId === node.asset?.assetId)
        : null;
    if (item) {
      return BigInt(item.amount) >= BigInt(node.asset.amount);
    }

    const klass =
      node.asset.assetCategory === 'ERC1155' &&
      node.asset.assetAddress.toLowerCase() ===
        game.classesAddress.toLowerCase()
        ? character.heldClasses.find(
            klass => klass.classId === node.asset?.assetId,
          )
        : null;

    if (klass) {
      return BigInt(klass.level) >= BigInt(node.asset.amount);
    }

    const experience =
      node.asset.assetCategory === 'ERC20' &&
      node.asset.assetAddress.toLowerCase() ===
        game.experienceAddress.toLowerCase()
        ? true
        : false;

    if (experience) {
      return BigInt(character.experience) >= BigInt(node.asset.amount);
    }
  }

  if (node.operator === 'NOT') {
    if (node.children.length === 0) {
      const newNode = {
        ...node,
        operator: 'NIL' as RequirementNode['operator'],
      };
      return !checkClaimRequirements(newNode, game, character);
    }
    return !checkClaimRequirements(node.children[0], game, character);
  }

  if (node.operator === 'AND') {
    return node.children.every(child =>
      checkClaimRequirements(child, game, character),
    );
  }

  if (node.operator === 'OR') {
    return node.children.some(child =>
      checkClaimRequirements(child, game, character),
    );
  }

  return false;
};
