export type Metadata = {
  name: string;
  description: string;
  image: string;
};

export type GameMeta = Metadata & {
  id: string;
  uri: string;
  owners: string[];
  masters: string[];
  players: string[];
  characters: { id: string }[];
  classes: { id: string }[];
  items: { id: string }[];
  experience: bigint;
};

export type Game = Metadata & {
  id: string;
  experienceAddress: string;
  itemsAddress: string;
  classesAddress: string;
  uri: string;
  owners: string[];
  masters: string[];
  characters: Character[];
  classes: Class[];
  items: Item[];
  experience: bigint;
};

export type Character = Metadata & {
  id: string;
  name: string;
  characterId: string;
  account: string;
  player: string;
  jailed: boolean;
  removed: boolean;
  experience: bigint;
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
