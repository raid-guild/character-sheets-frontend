import {
  CharacterInfoFragment,
  ClassInfoFragment,
  FullGameInfoFragment,
  GameMetaInfoFragment,
  ItemInfoFragment,
} from '@/graphql/autogen/types';

import { Character, Class, Game, GameMeta, Item, Metadata } from './types';

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
        return [
          `https://ipfs.io/ipfs/${hash}/`,
          `https://cloudflare-ipfs.com/ipfs/${hash}/`,
        ];
      }
      case 'ipns': {
        const name = uri.match(/^ipns:(\/\/)?(.*)$/i)?.[2];
        return [
          `https://ipfs.io/ipns/${name}/`,
          `https://cloudflare-ipfs.com/ipns/${name}/`,
        ];
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

export const shortenText = (text: string, length: number): string => {
  if (text.length <= length) {
    return text;
  }

  return `${text.slice(0, length)}...`;
};

export const timeout = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const fetchMetadata = async (uri: string): Promise<Metadata> => {
  const res = await fetch(`${uri}`);
  return await res.json();
};

export const formatCharacter = async (
  character: CharacterInfoFragment,
  classes: Class[],
  items: Item[],
): Promise<Character> => {
  const metadata = await fetchMetadata(uriToHttp(character.uri)[0]);

  const characterClasses = classes.filter(c =>
    character.heldClasses.find(h => h.classEntity.classId === c.classId),
  );

  const heldItems: Item[] = [];
  const equippedItems: Item[] = [];

  items.forEach(i => {
    const held = character.heldItems.find(h => h.item.itemId === i.itemId);
    if (!held) return;
    heldItems.push({
      ...i,
      amount: BigInt(held.amount),
    });
    const equipped = character.equippedItems.find(
      e => e.item.itemId === i.itemId,
    );
    if (!equipped) return;
    equippedItems.push({
      ...i,
      amount: BigInt(equipped.heldItem.amount),
    });
  });

  return {
    id: character.id,
    uri: character.uri,
    name: character.name ?? metadata.name,
    description: metadata.description,
    image: uriToHttp(metadata.image)[0],
    experience: character.experience,
    characterId: character.characterId,
    account: character.account,
    player: character.player,
    jailed: character.jailed,
    classes: characterClasses,
    heldItems,
    equippedItems,
  };
};

export const formatClass = async (
  classEntity: ClassInfoFragment,
): Promise<Class> => {
  const metadata = await fetchMetadata(uriToHttp(classEntity.uri)[0]);

  return {
    id: classEntity.id,
    uri: classEntity.uri,
    name: classEntity.name ?? metadata.name,
    description: metadata.description,
    image: uriToHttp(metadata.image)[0],
    classId: classEntity.classId,
    holders: classEntity.holders,
    equippers: classEntity.equippers,
  };
};

export const formatItem = async (item: ItemInfoFragment): Promise<Item> => {
  const metadata = await fetchMetadata(uriToHttp(item.uri)[0]);

  return {
    id: item.id,
    uri: item.uri,
    name: item.name ?? metadata.name,
    description: metadata.description,
    image: uriToHttp(metadata.image)[0],
    itemId: item.itemId,
    supply: BigInt(item.supply),
    totalSupply: BigInt(item.totalSupply),
    amount: BigInt(0),
    holders: item.holders,
    equippers: item.equippers,
  };
};

export const formatGameMeta = async (
  game: GameMetaInfoFragment,
): Promise<GameMeta> => {
  const metadata = await fetchMetadata(uriToHttp(game.uri)[0]);

  return {
    id: game.id,
    uri: game.uri,
    owners: game.owners,
    masters: game.masters,
    name: metadata.name,
    description: metadata.description,
    image: uriToHttp(metadata.image)[0],
    characters: game.characters,
    classes: game.classes,
    items: game.items,
    experience: game.experience,
  };
};

export const formatGame = async (game: FullGameInfoFragment): Promise<Game> => {
  const metadata = await fetchMetadata(uriToHttp(game.uri)[0]);
  const classes = await Promise.all(game.classes.map(formatClass));
  const items = await Promise.all(game.items.map(formatItem));

  return {
    id: game.id,
    classesAddress: game.classesAddress,
    itemsAddress: game.itemsAddress,
    uri: game.uri,
    owners: game.owners,
    masters: game.masters,
    name: metadata.name,
    description: metadata.description,
    image: uriToHttp(metadata.image)[0],
    characters: await Promise.all(
      game.characters.map(c => formatCharacter(c, classes, items)),
    ),
    classes,
    items,
    experience: game.experience,
  };
};
