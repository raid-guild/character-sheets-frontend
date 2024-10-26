import {
  CharacterInfoFragment,
  ClassInfoFragment,
  FullGameInfoFragment,
  GameMetaInfoFragment,
  ItemInfoFragment,
} from '@/graphql/autogen/types';

import { decodeCraftRequirements, decodeRequirementNode } from './requirements';
import {
  Character,
  Class,
  EquippedItem,
  Game,
  GameMeta,
  HeldClass,
  Item,
  Metadata,
} from './types';

import { Cache } from 'memory-cache';

const IPFS_GATEWAYS = [
  `https://ipfs.io`,
  `https://w3s.link`,
  `https://cloudflare-ipfs.com`,
  `https://dweb.link`,
  `https://flk-ipfs.xyz`,
];

// Using env here to avoid initialization issues with the ENVIRONMENT constant
if (process.env.NEXT_PUBLIC_ENABLE_PINATA_GATEWAY === 'true') {
  IPFS_GATEWAYS.unshift('https://charactersheets.mypinata.cloud');
}

/**
 * Given a URI that may be ipfs, ipns, http, https, ar, or data protocol, return the fetch-able http(s) URLs for the same content
 * @param uri to convert to fetch-able http url
 */
export const uriToHttp = (uri: string): string[] => {
  try {
    const protocol = uri.split(':')[0].toLowerCase();
    switch (protocol) {
      case 'data':
        return [uri];
      case 'https':
        return [uri];
      case 'http':
        return ['https' + uri.substring(4), uri];
      case 'ipfs': {
        const hash = uri.match(/^ipfs:(\/\/)?(.*)$/i)?.[2];
        return IPFS_GATEWAYS.map(g => `${g}/ipfs/${hash}`);
      }
      case 'ipns': {
        const name = uri.match(/^ipns:(\/\/)?(.*)$/i)?.[2];
        return IPFS_GATEWAYS.map(g => `${g}/ipns/${name}`);
      }
      case 'ar': {
        const tx = uri.match(/^ar:(\/\/)?(.*)$/i)?.[2];
        return [`https://arweave.net/${tx}`];
      }
      default:
        return [''];
    }
  } catch (e) {
    console.error(e);
    return [''];
  }
};

const cache = new Cache<string, Metadata>();

export const fetchMetadata = async (
  uri: string | undefined,
): Promise<Metadata> => {
  if (!uri) {
    throw new Error('URI is required');
  }

  const cachedResponse = cache.get(uri);
  if (cachedResponse) {
    return cachedResponse;
  }

  const https = uriToHttp(uri);

  const controllers = https.map(() => new AbortController());

  try {
    const response = await Promise.any(
      https.map(async (endpoint, index) => {
        const controller = controllers[index];
        const { signal } = controller;

        const res = await fetch(endpoint, { signal });
        if (res.ok) {
          // Abort other requests once a successful one is found
          controllers.forEach((ctrl, i) => {
            if (i !== index) ctrl.abort();
          });
          const metadata = await res.json();
          metadata.name = metadata.name || '';
          metadata.description = metadata.description || '';
          metadata.image = metadata.image || '';
          metadata.equippable_layer = metadata.equippable_layer || null;
          metadata.attributes = metadata.attributes || [];
          cache.put(uri, metadata);
          return metadata;
        }
        throw new Error(`Failed to fetch from ${endpoint}`);
      }),
    );

    return response;
  } catch (error) {
    console.error(`Failed to fetch for URI: ${uri}: `, error);
  }
  return {
    name: '',
    description: '',
    image: '',
    equippable_layer: null,
    attributes: [],
  };
};

export const shortenAddress = (address: string, chars = 4): string => {
  return `${address.slice(0, chars + 2)}...${address.slice(
    address.length - chars,
  )}`;
};

export const shortenText = (
  text: string | undefined,
  length: number,
): string => {
  if (!text) {
    return '';
  }

  if (text.length <= length) {
    return text;
  }

  return `${text.slice(0, length)}...`;
};

export const timeout = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const formatFullCharacter = async (
  character: CharacterInfoFragment,
): Promise<Character> => {
  const metadata = await fetchMetadata(character.uri);

  const heldClasses = await Promise.all(
    character.heldClasses.map(async c => {
      const info = await formatClass(c.classEntity);
      return {
        ...info,
        experience: BigInt(c.experience).toString(),
        level: BigInt(c.level).toString(),
      };
    }),
  );

  const heldItems = await Promise.all(
    character.heldItems.map(async i => {
      const info = await formatItem(i.item);
      return {
        ...info,
        amount: BigInt(i.amount).toString(),
      };
    }),
  );

  const equippedItems: EquippedItem[] = [];
  character.equippedItems.map(e => {
    const info = heldItems.find(i => i.itemId === e.item.itemId);
    if (!info) return null;
    equippedItems.push({
      ...info,
      amount: BigInt(e.heldItem.amount).toString(),
      equippedAt: Number(e.equippedAt) * 1000,
    });
    return null;
  });

  return {
    id: character.id,
    chainId: Number(character.game.chainId),
    gameId: character.game.id,
    uri: character.uri,
    name: metadata.name,
    description: metadata.description,
    image: metadata.image,
    attributes: metadata.attributes,
    experience: character.experience,
    characterId: character.characterId,
    account: character.account,
    player: character.player,
    jailed: character.jailed,
    approved: character.approved,
    removed: character.removed,
    heldClasses,
    heldItems,
    equippedItems,
    equippable_layer: null,
  };
};

export const formatCharacter = async (
  character: CharacterInfoFragment,
  classes: Class[],
  items: Item[],
): Promise<Character> => {
  const metadata = await fetchMetadata(character.uri);

  const heldClasses = classes
    .map(c => {
      const held = character.heldClasses.find(
        h => h.classEntity.classId === c.classId,
      );
      if (!held) return null;
      return {
        ...c,
        experience: BigInt(held.experience).toString(),
        level: BigInt(held.level).toString(),
      };
    })
    .filter(c => c !== null) as HeldClass[];

  const heldItems: Item[] = [];
  const equippedItems: EquippedItem[] = [];

  items.forEach(i => {
    const held = character.heldItems.find(h => h.item.itemId === i.itemId);
    if (!held) return;
    heldItems.push({
      ...i,
      amount: BigInt(held.amount).toString(),
    });
    const equipped = character.equippedItems.find(
      e => e.item.itemId === i.itemId,
    );
    if (!equipped) return;
    equippedItems.push({
      ...i,
      amount: BigInt(equipped.heldItem.amount).toString(),
      equippedAt: Number(equipped.equippedAt) * 1000,
    });
  });

  return {
    id: character.id,
    chainId: Number(character.game.chainId),
    gameId: character.game.id,
    uri: character.uri,
    name: metadata.name,
    description: metadata.description,
    image: metadata.image,
    attributes: metadata.attributes,
    experience: character.experience,
    characterId: character.characterId,
    account: character.account,
    player: character.player,
    jailed: character.jailed,
    approved: character.approved,
    removed: character.removed,
    heldClasses,
    heldItems,
    equippedItems,
    equippable_layer: null,
  };
};

export const formatClass = async (
  classEntity: ClassInfoFragment,
): Promise<Class> => {
  const metadata = await fetchMetadata(classEntity.uri);

  return {
    id: classEntity.id,
    uri: classEntity.uri,
    name: metadata.name,
    description: metadata.description,
    image: metadata.image,
    claimable: classEntity.claimable,
    classId: classEntity.classId,
    holders: classEntity.holders.map(h => h.character),
    equippable_layer: null,
    attributes: metadata.attributes,
  };
};

export const formatItem = async (item: ItemInfoFragment): Promise<Item> => {
  const metadata = await fetchMetadata(item.uri);

  const decodedCraftRequirements = decodeCraftRequirements(
    item.craftRequirementsBytes,
  );

  const decodedRequirementNode = decodeRequirementNode(
    item.claimRequirementsBytes,
  );

  return {
    id: item.id,
    uri: item.uri,
    name: metadata.name,
    description: metadata.description,
    image: metadata.image,
    equippable_layer: metadata.equippable_layer,
    attributes: metadata.attributes,
    itemId: item.itemId,
    soulbound: item.soulbound,
    supply: BigInt(item.supply).toString(),
    totalSupply: BigInt(item.totalSupply).toString(),
    amount: BigInt(0).toString(),
    holders: item.holders.map(h => h.character),
    equippers: item.equippers.map(e => e.character),
    merkleRoot: item.merkleRoot,
    distribution: item.distribution,
    craftable: item.craftable,
    craftRequirements: decodedCraftRequirements,
    claimRequirements: decodedRequirementNode,
  };
};

export const formatGameMeta = async (
  game: GameMetaInfoFragment,
): Promise<GameMeta> => {
  const metadata = await fetchMetadata(game.uri);

  return {
    id: game.id,
    startedAt: Number(game.startedAt) * 1000,
    chainId: Number(game.chainId),
    uri: game.uri,
    owner: game.owner.address,
    admins: game.admins.map(a => a.address),
    masters: game.masters.map(m => m.address),
    players: game.characters.map(c => c.player),
    name: metadata.name,
    description: metadata.description,
    image: metadata.image,
    characters: game.characters,
    classes: game.classes,
    items: game.items,
    experience: game.experience,
    equippable_layer: null,
    attributes: metadata.attributes,
  };
};

export const formatGame = async (game: FullGameInfoFragment): Promise<Game> => {
  const metadata = await fetchMetadata(game.uri);
  const classes = await Promise.all(game.classes.map(formatClass));
  const items = await Promise.all(game.items.map(formatItem));

  return {
    id: game.id,
    startedAt: Number(game.startedAt) * 1000,
    chainId: Number(game.chainId),
    classesAddress: game.classesAddress,
    itemsAddress: game.itemsAddress,
    itemsManager: game.itemsManager,
    experienceAddress: game.experienceAddress,
    characterEligibilityAdaptor: game.characterEligibilityAdaptor,
    hatsAdaptor: game.hatsAdaptor,
    uri: game.uri,
    baseTokenURI: game.baseTokenURI,
    owner: game.owner.address,
    admins: game.admins.map(a => a.address),
    masters: game.masters.map(m => m.address),
    gameMasterHatEligibilityModule:
      game.hatsData.gameMasterHatEligibilityModule,
    name: metadata.name,
    description: metadata.description,
    image: metadata.image,
    characters: await Promise.all(
      game.characters.map(c => formatCharacter(c, classes, items)),
    ),
    classes,
    items,
    experience: game.experience,
    equippable_layer: null,
    attributes: metadata.attributes,
  };
};
