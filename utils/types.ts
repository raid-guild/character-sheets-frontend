import { ObjectId } from 'mongodb';

export type Attribute = {
  trait_type: string;
  value: string;
};

export type Metadata = {
  name: string;
  description: string;
  image: string;
  equippable_layer: string | null;
  attributes: Attribute[];
};

export type GameMeta = Metadata & {
  id: string;
  startedAt: number;
  chainId: number;
  uri: string;
  owner: string;
  admins: string[];
  masters: string[];
  players: string[];
  characters: { id: string }[];
  classes: { id: string }[];
  items: { id: string }[];
  experience: string;
};

export type Game = Metadata & {
  id: string;
  startedAt: number;
  chainId: number;
  experienceAddress: string;
  itemsAddress: string;
  classesAddress: string;
  characterEligibilityAdaptor: string;
  hatsAdaptor: string;
  itemsManager: string;
  uri: string;
  baseTokenURI: string;
  owner: string;
  admins: string[];
  masters: string[];
  gameMasterHatEligibilityModule: string;
  characters: Character[];
  classes: Class[];
  items: Item[];
  experience: string;
};

export type Character = Metadata & {
  id: string;
  name: string;
  characterId: string;
  account: string;
  player: string;
  jailed: boolean;
  approved: string;
  removed: boolean;
  experience: string;
  uri: string;
  classes: Class[];
  heldItems: Item[];
  equippedItems: EquippedItem[];
};

export type Class = Metadata & {
  id: string;
  classId: string;
  uri: string;
  claimable: boolean;
  holders: { id: string; characterId: string }[];
};

export type ItemRequirement = {
  amount: string;
  assetId: string;
  assetAddress: string;
  assetCategory: string;
};

export type Item = Metadata & {
  id: string;
  itemId: string;
  uri: string;
  soulbound: boolean;
  distribution: string;
  supply: string;
  totalSupply: string;
  amount: string;
  requirements: ItemRequirement[];
  holders: { id: string; characterId: string }[];
  equippers: { id: string; characterId: string }[];
  merkleRoot: string;
};

export type EquippedItem = Item & {
  equippedAt: number;
};

export type ClaimableTreeDB = {
  _id: ObjectId;
  gameAddress: string;
  itemId: string;
  tree: string;
  updatedAt: Date;
  updatedBy: string;
  createdAt: Date;
};

export type CharacterMetaDB = Metadata & {
  _id: ObjectId;
  chainId: string;
  gameAddress: string;
  characterId: string;
  account: string;
  player: string;
  uri: string;
  createdAt: Date;
  updatedAt: Date;
};
