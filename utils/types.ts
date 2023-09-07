export type Metadata = {
  name: string;
  description: string;
  image: string;
};

export type Game = Metadata & {
  id: string;
  uri: string;
  owners: string[];
  masters: string[];
  characters: Character[];
  classes: Class[];
  items: Item[];
};

export type Character = {
  id: string;
  characterId: string;
  name: string;
  account: string;
  player: string;
};

export type Class = {
  id: string;
  classId: string;
  name: string;
};

export type Item = {
  id: string;
  itemId: string;
  name: string;
};
