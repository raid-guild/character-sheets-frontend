import { ObjectId } from 'mongodb';

export type Metadata = {
  name: string;
  description: string;
  image: string;
};

export type GameMeta = Metadata & {
  id: string;
  startedAt: Date;
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
  startedAt: Date;
  chainId: number;
  experienceAddress: string;
  itemsAddress: string;
  classesAddress: string;
  characterEligibilityAdaptor: string;
  uri: string;
  owner: string;
  admins: string[];
  masters: string[];
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
  equippedItems: Item[];
};

export type Class = Metadata & {
  id: string;
  classId: string;
  uri: string;
  claimable: boolean;
  holders: { id: string }[];
};

export type ItemRequirement = {
  amount: bigint;
  assetId: bigint;
  assetAddress: string;
  assetCategory: string;
};

export type Item = Metadata & {
  id: string;
  itemId: string;
  uri: string;
  soulbound: boolean;
  supply: bigint;
  totalSupply: bigint;
  amount: bigint;
  requirements: ItemRequirement[];
  holders: { id: string }[];
  equippers: { id: string }[];
  merkleRoot: string;
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
