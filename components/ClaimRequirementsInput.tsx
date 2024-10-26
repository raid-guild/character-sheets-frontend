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

import { MultiSourceImage } from '@/components/MultiSourceImage';
import { useGame } from '@/contexts/GameContext';
import { shortenAddress } from '@/utils/helpers';
import { validateNode } from '@/utils/requirements';
import { Asset, Class, Item, RequirementNode } from '@/utils/types';

import { SelectClassInput } from './SelectClassInput';
import { SelectItemInput } from './SelectItemInput';

type Props = {
  node: RequirementNode | null;
  setNode: (node: RequirementNode | null) => void;
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
      {node && !isEditing && (
        <HStack w="100%" justify="space-between">
          <Button
            size="sm"
            variant="outline"
            maxH="24px"
            onClick={() => {
              setNode(null);
              setIsEditing(false);
            }}
            px={3}
          >
            Remove
          </Button>
          <Button
            size="sm"
            variant="outline"
            maxH="24px"
            onClick={() => {
              setIsEditing(true);
            }}
            px={3}
          >
            Edit
          </Button>
        </HStack>
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
  onRemove?: () => void;
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
  onRemove = () => {},
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
      setChildren(node.children);
      setAsset(node.asset);
      setOperator(node.operator);

      if (node.asset) {
        if (node.asset.assetCategory === 'ERC1155') {
          if (
            node.asset.assetAddress.toLowerCase() ===
            game?.itemsAddress.toLowerCase()
          ) {
            setSelectedItem(
              game?.items.find(i => i.itemId === node.asset?.assetId) ?? null,
            );
            setType('ITEM');
          }
          if (
            node.asset.assetAddress.toLowerCase() ===
            game?.classesAddress.toLowerCase()
          ) {
            setSelectedClass(
              game?.classes.find(c => c.classId === node.asset?.assetId) ??
                null,
            );
            setType('CLASS');
          }
        }
        if (
          node.asset.assetCategory === 'ERC20' &&
          node.asset.assetAddress.toLowerCase() ===
            game?.experienceAddress.toLowerCase()
        ) {
          setType('EXPERIENCE');
        }
      }
    } else {
      setOperator('NIL');
      setAsset(null);
      setChildren([]);
      setSelectedItem(null);
      setSelectedClass(null);
      setType('CLASS');
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

  const newNode = useMemo(() => {
    if (operator === 'NIL') {
      return {
        operator,
        asset,
        children: [],
      };
    }
    return {
      operator,
      asset: null,
      children: children.filter(c => !!c) as RequirementNode[],
    };
  }, [operator, asset, children]);

  const hasError = useMemo(() => !validateNode(newNode, game), [newNode, game]);
  const [showError, setShowError] = useState(false);

  return (
    <VStack
      w="100%"
      p={4}
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
          w="18rem"
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
              w="18rem"
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
              w="16.875rem"
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
        <VStack w="100%" p={3}>
          {children.map((child, idx) => (
            <>
              <HStack w="100%" position="relative">
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
                  onRemove={() => {
                    setChildren(children.filter((_, i) => i !== idx));
                    setIsEditingChildren(
                      isEditingChildren.filter((_, i) => i !== idx),
                    );
                  }}
                />
              </HStack>
              {idx < children.length - 1 && (
                <OperatorDisplay operator={operator} />
              )}
            </>
          ))}
          {isEditable && (
            <Button
              mt={1}
              size="sm"
              variant="outline"
              w="100%"
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

      <HStack mt={3} justify="space-between" w="100%">
        <HStack>
          <Button
            size="sm"
            variant="outline"
            maxH="24px"
            onClick={() => {
              setIsEditing(false);
              onRemove();
            }}
            px={3}
          >
            Remove
          </Button>
        </HStack>
        <HStack>
          <Button
            size="sm"
            variant="outline"
            maxH="24px"
            onClick={() => {
              setIsEditing(false);
              if (!node) {
                onRemove();
              }
            }}
            px={3}
          >
            Cancel
          </Button>
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
              setNode(newNode);
              setIsEditing(false);
            }}
            px={3}
          >
            Save
          </Button>
        </HStack>
      </HStack>
    </VStack>
  );
};

const ImageDisplay: React.FC<Item | Class> = ({ name, image }) => (
  <MultiSourceImage
    display="inline-block"
    alt={`${name} image`}
    h="24px"
    objectFit="contain"
    src={image}
    w="24px"
  />
);

export const RequirementNodeDisplay: React.FC<{
  node: RequirementNode | null;
  setNode?: (node: RequirementNode | null) => void;
  isEditing?: boolean;
  setIsEditing?: (editing: boolean) => void;
  isEditingParent?: boolean;
  setIsEditingParent?: (editing: boolean) => void;
  isEditable?: boolean;
  onRemove?: () => void;
}> = ({
  node,
  setNode = () => {},
  isEditing = false,
  setIsEditing = () => {},
  isEditingParent = false,
  setIsEditingParent = () => {},
  isEditable = true,
  onRemove = () => {},
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
        onRemove={onRemove}
      />
    );
  }

  if (node.operator === 'NIL') {
    if (!node.asset) {
      return null;
    }

    const item =
      node.asset.assetCategory === 'ERC1155' &&
      node.asset.assetAddress.toLowerCase() === game?.itemsAddress.toLowerCase()
        ? game?.items.find(i => i.itemId === node.asset?.assetId)
        : null;
    const klass =
      node.asset.assetCategory === 'ERC1155' &&
      node.asset.assetAddress.toLowerCase() ===
        game?.classesAddress.toLowerCase()
        ? game?.classes.find(c => c.classId === node.asset?.assetId)
        : null;
    const exp =
      node.asset.assetCategory === 'ERC20' &&
      node.asset.assetAddress.toLowerCase() ===
        game?.experienceAddress.toLowerCase()
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
      <HStack w="100%" bg="whiteAlpha.100" borderRadius={3} p={3}>
        {item && <ImageDisplay {...item} />}
        {klass && <ImageDisplay {...klass} />}
        {exp && (
          <Image
            alt="users"
            height="20px"
            src="/icons/xp.svg"
            width="20px"
            mr="4px"
          />
        )}
        <Text w="100%" flex={1}>
          Hold {klass && 'Level '}
          {node.asset.amount.toString()} of {assetLabel}
        </Text>
        {isEditable && isEditingParent && (
          <HStack>
            <Button
              size="sm"
              variant="outline"
              maxH="24px"
              onClick={() => {
                setNode(null);
                setIsEditing(false);
                onRemove();
              }}
              px={3}
            >
              Remove
            </Button>
            <Button
              size="sm"
              variant="outline"
              maxH="24px"
              onClick={() => {
                setIsEditing(true);
              }}
              px={3}
            >
              Edit
            </Button>
          </HStack>
        )}
      </HStack>
    );
  }
  if (node.operator === 'AND' || node.operator === 'OR') {
    return (
      <VStack w="100%" bg="whiteAlpha.100" borderRadius={3} p={3} spacing={1}>
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
              onRemove={() => {
                setNode({
                  ...node,
                  children: node.children.filter((_, i) => i !== idx),
                });
              }}
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
    <VStack w="100%" bg="whiteAlpha.100" borderRadius={3} p={3}>
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
        onRemove={() => {
          setNode({ ...node, children: [] });
          setIsEditingChildren([]);
        }}
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
