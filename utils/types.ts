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
  characters: { id: string }[];
  classes: { id: string }[];
  items: { id: string }[];
  experience: string;
};

export type Game = Metadata & {
  id: string;
  itemsAddress: string;
  classesAddress: string;
  uri: string;
  owners: string[];
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
  experience: string;
  uri: string;
  classes: Class[];
  items: Item[];
};

export type Class = Metadata & {
  id: string;
  classId: string;
  uri: string;
  name: string;
  holders: { id: string }[];
  equippers: { id: string }[];
};

export type Item = Metadata & {
  id: string;
  itemId: string;
  name: string;
  uri: string;
  supply: string;
  totalSupply: string;
  amount: string;
  holders: { id: string }[];
  equippers: { id: string }[];
};
