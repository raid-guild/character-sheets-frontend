export type Metadata = {
  name: string;
  description: string;
  image: string;
};

export type Game = Metadata & {
  id: string;
  uri: string;
  characters: Character[];
  classes: Class[];
  items: Item[];
};

export type Character = {
  id: string;
};

export type Class = {
  id: string;
};

export type Item = {
  id: string;
};
