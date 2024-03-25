import {
  Box,
  Button,
  HStack,
  Image,
  Input,
  Select,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import { zeroAddress } from 'viem';

import { useGame } from '@/contexts/GameContext';
import { shortenAddress } from '@/utils/helpers';
import { Asset, Class, Game, Item, RequirementNode } from '@/utils/types';

import { SelectClassInput } from './SelectClassInput';
import { SelectItemInput } from './SelectItemInput';

type Props = {
  node: RequirementNode | null;
  setNode: (node: RequirementNode | null) => void;
};

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
        node.asset.assetAddress === game.itemsAddress &&
        !game.items.find(i => i.itemId === node.asset?.assetId)
      ) {
        return false;
      }
      if (
        node.asset.assetAddress === game.classesAddress &&
        !game.classes.find(c => c.classId === node.asset?.assetId)
      ) {
        return false;
      }
    }
    if (node.asset.assetCategory === 'ERC20') {
      if (node.asset.assetAddress !== game.experienceAddress) {
        return false;
      }
    }
  }

  if (node.operator === 'AND' || node.operator === 'OR') {
    if (!node.children) return false;
    if (node.children.length === 0) return false;
    if (!node.children.every(n => validateNode(n, game))) return false;
  }

  if (node.operator === 'NOT') {
    if (!node.children || node.children.length === 0) {
      const newNode = {
        ...node,
        operator: 'NIL' as RequirementNode['operator'],
      };
      return validateNode(newNode, game);
    }
    if (node.children.length !== 1) return false;
    if (!validateNode(node.children[0], game)) return false;
  }

  return true;
};

export const ClaimRequirementsInput: React.FC<Props> = ({ node, setNode }) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <VStack w="100%" p={3} spacing={3}>
      {(node || isEditing) && (
        <RequirementNodeDisplay
          node={node}
          setNode={setNode}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
        />
      )}
      {!isEditing && !node && (
        <Button onClick={() => setIsEditing(true)}>Add Requirement</Button>
      )}
      {node && (node.operator === 'AND' || node.operator == 'OR') && (
        <Button
          size="sm"
          variant="outline"
          maxH="24px"
          onClick={() => {
            setIsEditing(e => !e);
          }}
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </Button>
      )}
    </VStack>
  );
};

const RequirementNodeEditor: React.FC<{
  node: RequirementNode | null;
  setNode: (node: RequirementNode | null) => void;
  isEditing?: boolean;
  setIsEditing?: (editing: boolean) => void;
  isEditingParent?: boolean;
  setIsEditingParent?: (editing: boolean) => void;
  isEditingChildren?: boolean[];
  setIsEditingChildren?: (editing: boolean[]) => void;
  isEditable?: boolean;
}> = ({
  node,
  setNode,
  isEditing = false,
  setIsEditing = () => {},
  // isEditingParent = false,
  // setIsEditingParent = () => {},
  isEditingChildren = [],
  setIsEditingChildren = () => {},
  isEditable = true,
}) => {
  const [operator, setOperator] = useState<RequirementNode['operator']>('NIL');
  const [asset, setAsset] = useState<RequirementNode['asset'] | null>(null);
  const [children, setChildren] = useState<Array<RequirementNode | null>>([]);

  const [type, setType] = useState<'CLASS' | 'ITEM' | 'EXPERIENCE'>('CLASS');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  const { game } = useGame();

  useEffect(() => {
    if (node) {
      setOperator(node.operator);
      setAsset(node.asset);
      setChildren(node.children);

      if (node.asset) {
        if (node.asset.assetCategory === 'ERC1155') {
          if (node.asset.assetAddress === game?.itemsAddress) {
            setSelectedItem(
              game?.items.find(i => i.itemId === node.asset?.assetId) ?? null,
            );
            setType('ITEM');
          }
          if (node.asset.assetAddress === game?.classesAddress) {
            setSelectedClass(
              game?.classes.find(c => c.classId === node.asset?.assetId) ??
                null,
            );
            setType('CLASS');
          }
        }
        if (
          node.asset.assetCategory === 'ERC20' &&
          node.asset.assetAddress === game?.experienceAddress
        ) {
          setType('EXPERIENCE');
        }
      }
    }
  }, [node, isEditing, game]);

  useEffect(() => {
    let assetCategory: Asset['assetCategory'] = 'ERC1155';
    let assetAddress: Asset['assetAddress'] = zeroAddress;

    switch (type) {
      case 'CLASS':
        assetCategory = 'ERC1155';
        assetAddress = game?.classesAddress ?? zeroAddress;
        break;
      case 'ITEM':
        assetCategory = 'ERC1155';
        assetAddress = game?.itemsAddress ?? zeroAddress;
        break;
      case 'EXPERIENCE':
        assetCategory = 'ERC20';
        assetAddress = game?.experienceAddress ?? zeroAddress;
        break;
      default:
        break;
    }
    setAsset(asset => ({
      assetCategory,
      assetAddress,
      assetId: asset?.assetId ?? '0',
      amount: asset?.amount ?? '0',
    }));
  }, [type, game]);

  useEffect(() => {
    if (selectedItem) {
      setAsset(asset =>
        asset
          ? {
              ...asset,
              assetCategory: 'ERC1155',
              assetAddress: game?.itemsAddress ?? zeroAddress,
              assetId: selectedItem.itemId,
            }
          : null,
      );
    }
  }, [selectedItem, game]);

  useEffect(() => {
    if (selectedClass) {
      setAsset(asset =>
        asset
          ? {
              ...asset,
              assetCategory: 'ERC1155',
              assetAddress: game?.classesAddress ?? zeroAddress,
              assetId: selectedClass.classId,
            }
          : null,
      );
    }
  }, [selectedClass, game]);

  const hasError = useMemo(
    () =>
      !validateNode(
        {
          operator,
          asset,
          children: children.filter(n => !!n) as RequirementNode[],
        },
        game,
      ),
    [operator, asset, children, game],
  );
  const [showError, setShowError] = useState(false);

  return (
    <VStack
      w="100%"
      p={4}
      spacing={3}
      borderRadius={4}
      border="1px solid"
      borderColor="white"
    >
      <HStack w="100%" justify="space-between">
        <Text w="100%">Requires:</Text>
        <Select
          value={operator}
          onChange={e =>
            setOperator(e.target.value as RequirementNode['operator'])
          }
          size="sm"
          variant="outline"
        >
          <option value="NIL">Hold</option>
          <option value="AND">AND</option>
          <option value="OR">OR</option>
          <option value="NOT">NOT</option>
        </Select>
      </HStack>
      {operator === 'NIL' && (
        <>
          <HStack w="100%" justify="space-between">
            <Text w="100%">Asset:</Text>
            <Select
              value={type}
              onChange={e =>
                setType(e.target.value as 'CLASS' | 'ITEM' | 'EXPERIENCE')
              }
              size="sm"
              variant="outline"
            >
              <option value="CLASS">Class Levels</option>
              <option value="ITEM">Items</option>
              <option value="EXPERIENCE">Experience</option>
            </Select>
          </HStack>
          {type === 'CLASS' && (
            <SelectClassInput
              selectedClass={selectedClass}
              setSelectedClass={setSelectedClass}
              classes={game?.classes ?? []}
            />
          )}
          {type === 'ITEM' && (
            <SelectItemInput
              selectedItem={selectedItem}
              setSelectedItem={setSelectedItem}
              items={game?.items ?? []}
            />
          )}
          <HStack w="100%" justify="space-between">
            <Text w="100%">Amount:</Text>
            <Input
              fontSize="xs"
              h="30px"
              onChange={e => {
                setAsset(asset =>
                  asset ? { ...asset, amount: e.target.value } : asset,
                );
              }}
              placeholder="amount"
              type="number"
              value={asset?.amount ?? '0'}
            />
          </HStack>
        </>
      )}
      {operator === 'NOT' && (
        <RequirementNodeDisplay
          node={children[0] ?? null}
          setNode={newNode => {
            if (newNode) {
              setChildren([newNode]);
            } else {
              setChildren([]);
            }
          }}
          isEditingParent={true}
          setIsEditingParent={setIsEditing}
          isEditing={isEditingChildren[0] ?? false}
          setIsEditing={editing => {
            setIsEditingChildren([editing]);
          }}
          isEditable={isEditable}
        />
      )}
      {operator === 'AND' || operator === 'OR' ? (
        <VStack w="100%" p={3} spacing={3}>
          {children.map((child, idx) => (
            <>
              <RequirementNodeDisplay
                key={idx}
                node={child}
                setNode={newNode => {
                  setChildren(
                    children.map((c, i) => (i === idx ? newNode : c)),
                  );
                }}
                isEditingParent={isEditing}
                setIsEditingParent={setIsEditing}
                isEditing={isEditingChildren[idx] ?? false}
                setIsEditing={editing => {
                  setIsEditingChildren(
                    isEditingChildren.map((_editing, i) =>
                      i === idx ? editing : _editing,
                    ),
                  );
                }}
                isEditable={isEditable}
              />
              {idx < children.length - 1 && (
                <OperatorDisplay operator={operator} />
              )}
            </>
          ))}
          {isEditable && (
            <Button
              size="sm"
              variant="outline"
              maxH="24px"
              onClick={() => {
                setChildren([...children, null]);
                setIsEditingChildren([...isEditingChildren, true]);
              }}
            >
              Add Requirement
            </Button>
          )}
        </VStack>
      ) : null}
      {showError && (
        <Text color="red.500" fontSize="xs">
          Invalid Requirement
        </Text>
      )}

      <Button
        size="sm"
        variant="solid"
        maxH="24px"
        onClick={() => {
          if (hasError) {
            setShowError(true);
            return;
          }
          setShowError(false);
          setNode({
            operator,
            asset,
            children: children.filter(c => !!c) as RequirementNode[],
          });
          setIsEditing(false);
        }}
      >
        Save
      </Button>
    </VStack>
  );
};

const ImageDisplay: React.FC<Item | Class> = ({ name, image }) => (
  <Image
    display="inline-block"
    alt={`${name} image`}
    h="24px"
    objectFit="contain"
    src={image}
    w="24px"
  />
);

const RequirementNodeDisplay: React.FC<{
  node: RequirementNode | null;
  setNode?: (node: RequirementNode | null) => void;
  isEditing?: boolean;
  setIsEditing?: (editing: boolean) => void;
  isEditingParent?: boolean;
  setIsEditingParent?: (editing: boolean) => void;
  isEditable?: boolean;
}> = ({
  node,
  setNode = () => {},
  isEditing = false,
  setIsEditing = () => {},
  isEditingParent = false,
  setIsEditingParent = () => {},
  isEditable = true,
}) => {
  const { game } = useGame();
  const [isEditingChildren, setIsEditingChildren] = useState(
    node?.children.map(() => false) || [],
  );

  useEffect(() => {
    setIsEditingChildren(node?.children.map(() => false) || []);
  }, [node]);

  if (isEditing || !node) {
    return (
      <RequirementNodeEditor
        node={node}
        setNode={setNode}
        isEditingParent={isEditingParent}
        setIsEditingParent={setIsEditingParent}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        isEditingChildren={isEditingChildren}
        setIsEditingChildren={setIsEditingChildren}
        isEditable={isEditable}
      />
    );
  }

  if (node.operator === 'NIL') {
    if (!node.asset) {
      return null;
    }

    const item =
      node.asset.assetCategory === 'ERC1155' &&
      node.asset.assetAddress === game?.itemsAddress
        ? game?.items.find(i => i.itemId === node.asset?.assetId)
        : null;
    const klass =
      node.asset.assetCategory === 'ERC1155' &&
      node.asset.assetAddress === game?.classesAddress
        ? game?.classes.find(c => c.classId === node.asset?.assetId)
        : null;
    const exp =
      node.asset.assetCategory === 'ERC20' &&
      node.asset.assetAddress === game?.experienceAddress
        ? true
        : false;

    const assetLabel = (() => {
      if (item) {
        return `Item: ${item.name}`;
      }
      if (klass) {
        return `Class: ${klass.name}`;
      }
      if (exp) {
        return `Experience`;
      }
      return `Asset: ${node.asset.assetCategory} (${shortenAddress(
        node.asset.assetAddress,
      )})`;
    })();

    return (
      <HStack w="100%" bg="whiteAlpha.100" borderRadius={3} p={3} spacing={3}>
        {item && <ImageDisplay {...item} />}
        {klass && <ImageDisplay {...klass} />}
        <Text w="100%" flex={1}>
          Hold {klass && 'Level '}
          {node.asset.amount.toString()} of {assetLabel}
        </Text>
        {isEditable && (
          <Button
            size="sm"
            variant="outline"
            maxH="24px"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        )}
      </HStack>
    );
  }
  if (node.operator === 'AND' || node.operator === 'OR') {
    return (
      <VStack w="100%" bg="whiteAlpha.100" borderRadius={3} p={3} spacing={3}>
        {node.children.map((child, idx) => (
          <>
            <RequirementNodeDisplay
              key={idx}
              node={child}
              setNode={newNode => {
                setNode({
                  ...node,
                  children: node.children
                    .map((c, i) => (i === idx ? newNode : c))
                    .filter(c => !!c) as RequirementNode[],
                });
              }}
              isEditingParent={isEditing}
              setIsEditingParent={setIsEditing}
              isEditing={isEditingChildren[idx]}
              setIsEditing={editing => {
                setIsEditingChildren(
                  isEditingChildren.map((_editing, i) =>
                    i === idx ? editing : _editing,
                  ),
                );
              }}
              isEditable={isEditable}
            />
            {idx < node.children.length - 1 && (
              <OperatorDisplay operator={node.operator} />
            )}
          </>
        ))}
      </VStack>
    );
  }

  let child = node.children[0];
  if (!child) {
    child = node;
    child.operator = 'NIL';
  }
  return (
    <VStack w="100%" bg="whiteAlpha.100" borderRadius={3} p={3} spacing={3}>
      <OperatorDisplay operator={node.operator} />
      <RequirementNodeDisplay
        node={node.children[0]}
        setNode={newNode => {
          if (newNode) {
            setNode({
              ...node,
              children: [newNode] as RequirementNode[],
            });
          } else {
            setNode({ ...node, children: [] });
          }
        }}
        isEditingParent={isEditing}
        setIsEditingParent={setIsEditing}
        isEditing={isEditingChildren[0] ?? false}
        setIsEditing={editing => {
          setIsEditingChildren([editing]);
        }}
        isEditable={isEditable}
      />
    </VStack>
  );
};

const OperatorDisplay: React.FC<{ operator: RequirementNode['operator'] }> = ({
  operator,
}) => {
  return (
    <HStack w="100%" p={2} spacing={2} justify="center">
      <Box w="100%" h="1px" bg="whiteAlpha.500" flexGrow={1} />
      <Text
        textAlign="center"
        fontSize="xs"
        fontWeight="bold"
        color="whiteAlpha.700"
      >
        {operator}
      </Text>
      <Box w="100%" h="1px" bg="whiteAlpha.500" flexGrow={1} />
    </HStack>
  );
};
