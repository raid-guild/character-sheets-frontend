import {
  CharacterInfoFragment,
  ClassInfoFragment,
  FullGameInfoFragment,
  GameMetaInfoFragment,
  ItemInfoFragment,
} from '@/graphql/autogen/types';
import { ENVIRONMENT } from '@/utils/constants';

import {
  Character,
  Class,
  EquippedItem,
  Game,
  GameMeta,
  Item,
  Metadata,
} from './types';

/**
 * Given a URI that may be ipfs, ipns, http, https, ar, or data protocol, return the fetch-able http(s) URLs for the same content
 * @param uri to convert to fetch-able http url
 */
export const uriToHttp = (uri: string): string[] => {
  const IPFS_GATEWAYS = ['https://cloudflare-ipfs.com', 'https://ipfs.io'];

  if (ENVIRONMENT === 'main') {
    IPFS_GATEWAYS.unshift(
      'https://peach-immediate-rhinoceros-66.mypinata.cloud',
    );
  }
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
        return [];
    }
  } catch (e) {
    console.error(e);
    return ['', ''];
  }
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

const fetchMetadataFromUri = async (uri: string): Promise<Metadata> => {
  const res = await fetch(uri);
  if (!res.ok) throw new Error('Failed to fetch');
  const metadata = await res.json();
  metadata.name = metadata.name || '';
  metadata.description = metadata.description || '';
  metadata.image = metadata.image || '';
  metadata.equippable_layer = metadata.equippable_layer || null;
  metadata.attributes = metadata.attributes || [];
  return metadata;
};

const fetchMetadata = async (ipfsUri: string): Promise<Metadata> => {
  try {
    const uris = uriToHttp(ipfsUri);
    for (const u of uris) {
      try {
        const metadata = await fetchMetadataFromUri(u);
        return metadata;
      } catch (e) {
        console.error('Failed to fetch metadata from', u);
        continue;
      }
    }
  } catch (e) {
    console.error('Failed to fetch metadata from', ipfsUri);
  }
  return {
    name: '',
    description: '',
    image: '',
    equippable_layer: null,
    attributes: [],
  };
};

export const formatFullCharacter = async (
  character: CharacterInfoFragment,
): Promise<Character> => {
  const metadata = await fetchMetadata(character.uri);

  const heldClasses = await Promise.all(
    character.heldClasses.map(async c => formatClass(c.classEntity)),
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
    image: uriToHttp(metadata.image)[0],
    attributes: metadata.attributes,
    experience: character.experience,
    characterId: character.characterId,
    account: character.account,
    player: character.player,
    jailed: character.jailed,
    approved: character.approved,
    removed: character.removed,
    classes: heldClasses,
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

  const characterClasses = classes.filter(c =>
    character.heldClasses.find(h => h.classEntity.classId === c.classId),
  );

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
    image: uriToHttp(metadata.image)[0],
    attributes: metadata.attributes,
    experience: character.experience,
    characterId: character.characterId,
    account: character.account,
    player: character.player,
    jailed: character.jailed,
    approved: character.approved,
    removed: character.removed,
    classes: characterClasses,
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
    image: uriToHttp(metadata.image)[0],
    claimable: classEntity.claimable,
    classId: classEntity.classId,
    holders: classEntity.holders.map(h => h.character),
    equippable_layer: null,
    attributes: metadata.attributes,
  };
};

// export const formatItemRequirement = (
//   r: ItemRequirementInfoFragment,
// ): ItemRequirement => {
//   return {
//     amount: BigInt(r.amount).toString(),
//     assetAddress: r.assetAddress,
//     assetCategory: r.assetCategory,
//     assetId: BigInt(r.assetId).toString(),
//   };
// };

export const formatItem = async (item: ItemInfoFragment): Promise<Item> => {
  const metadata = await fetchMetadata(item.uri);

  return {
    id: item.id,
    uri: item.uri,
    name: metadata.name,
    description: metadata.description,
    image: uriToHttp(metadata.image)[0],
    equippable_layer: metadata.equippable_layer
      ? uriToHttp(metadata.equippable_layer)[0]
      : null,
    attributes: metadata.attributes,
    itemId: item.itemId,
    soulbound: item.soulbound,
    supply: BigInt(item.supply).toString(),
    totalSupply: BigInt(item.totalSupply).toString(),
    amount: BigInt(0).toString(),
    // requirements: item.requirements.map(formatItemRequirement),
    requirements: [],
    holders: item.holders.map(h => h.character),
    equippers: item.equippers.map(e => e.character),
    merkleRoot: item.merkleRoot,
    distribution: item.distribution,
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
    image: uriToHttp(metadata.image)[0],
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
    image: uriToHttp(metadata.image)[0],
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
