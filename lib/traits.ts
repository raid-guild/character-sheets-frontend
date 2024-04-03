import { capitalize } from 'lodash';

import {
  CharacterInfoFragment,
  GetCharacterInfoByIdDocument,
} from '@/graphql/autogen/types';
import { getGraphClient } from '@/graphql/client';
import { formatCharacter, formatItem, uriToHttp } from '@/utils/helpers';
import { Attribute, Item } from '@/utils/types';

export enum BaseTraitType {
  BACKGROUND = 'BACKGROUND',
  BODY = 'BODY',
  EYES = 'EYES',
  HAIR = 'HAIR',
  CLOTHING = 'CLOTHING',
  MOUTH = 'MOUTH',
}

export enum EquippableTraitType {
  EQUIPPED_ITEM_1 = 'EQUIPPED ITEM 1',
  EQUIPPED_WEARABLE = 'EQUIPPED WEARABLE',
  EQUIPPED_ITEM_2 = 'EQUIPPED ITEM 2',
}

/*
 * NOTE:
 * base trait names are formatted as <index>_<variant>_<color>
 * equippable trait names are formatted as <tag>_<name>_<uri>
 */
export type CharacterTraits = {
  [key in BaseTraitType | EquippableTraitType]: string;
};

export type TraitsArray = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];

export type ItemLayer = {
  name: string;
  description: string;
  thumbnail: string;
  layer: string;
  type: EquippableTraitType;
};

export const DEFAULT_ITEMS: Array<ItemLayer> = [
  {
    name: 'Babymoloch Chain',
    description: 'Babymoloch Chain',
    thumbnail: 'THUMB__BabyMoloch_chain',
    layer: '4_BabymolochChain',
    type: EquippableTraitType.EQUIPPED_ITEM_1,
  },
  {
    name: 'Demon Skull',
    description: 'Demon Skull',
    thumbnail: 'THUMB__Demon_Skull',
    layer: '4_DemonSkull',
    type: EquippableTraitType.EQUIPPED_ITEM_1,
  },
  {
    name: 'Druid Knife',
    description: 'Druid Knife',
    thumbnail: 'THUMB__Druid_Knife',
    layer: '4_DruidKnife',
    type: EquippableTraitType.EQUIPPED_ITEM_1,
  },
  {
    name: 'Elderbow',
    description: 'Elderbow',
    thumbnail: 'THUMB__Elderbow',
    layer: '4_Elderbow',
    type: EquippableTraitType.EQUIPPED_ITEM_1,
  },
  {
    name: 'Lute Of Lore',
    description: 'Lute Of Lore',
    thumbnail: 'THUMB__Lute_of_Lore',
    layer: '4_LuteOfLore',
    type: EquippableTraitType.EQUIPPED_ITEM_1,
  },
  {
    name: 'Rake',
    description: 'Rake',
    thumbnail: 'THUMB__Rake',
    layer: '4_Rake',
    type: EquippableTraitType.EQUIPPED_ITEM_1,
  },
  {
    name: 'Small Dagger',
    description: 'Small Dagger',
    thumbnail: 'THUMB__Small_Dagger',
    layer: '4_SmallDagger',
    type: EquippableTraitType.EQUIPPED_ITEM_1,
  },
  {
    name: 'Wooden Bow',
    description: 'Wooden Bow',
    thumbnail: 'THUMB__Wooden_Bow',
    layer: '4_WoodenBow',
    type: EquippableTraitType.EQUIPPED_ITEM_1,
  },
  {
    name: 'Wooden Staff',
    description: 'Wooden Staff',
    thumbnail: 'THUMB__Wooden_Staff',
    layer: '4_WoodenStaff',
    type: EquippableTraitType.EQUIPPED_ITEM_1,
  },
  {
    name: 'Archer Clothing',
    description: 'Archer Clothing',
    thumbnail: 'THUMB__Archer_clothing',
    layer: '5_Archer',
    type: EquippableTraitType.EQUIPPED_WEARABLE,
  },
  {
    name: 'Bard Clothing',
    description: 'Bard Clothing',
    thumbnail: 'THUMB__Bard_clothing',
    layer: '5_Bard',
    type: EquippableTraitType.EQUIPPED_WEARABLE,
  },
  {
    name: 'Cleric Clothing',
    description: 'Cleric Clothing',
    thumbnail: 'THUMB__Cleric_clothing',
    layer: '5_Cleric',
    type: EquippableTraitType.EQUIPPED_WEARABLE,
  },
  {
    name: 'Healer Clothing',
    description: 'Healer Clothing',
    thumbnail: 'THUMB__Healer_clothing',
    layer: '5_Healer',
    type: EquippableTraitType.EQUIPPED_WEARABLE,
  },
  {
    name: 'Hunter Clothing',
    description: 'Hunter Clothing',
    thumbnail: 'THUMB__Hunter_clothing',
    layer: '5_Hunter',
    type: EquippableTraitType.EQUIPPED_WEARABLE,
  },
  {
    name: 'Medic Clothing',
    description: 'Medic Clothing',
    thumbnail: 'THUMB__Medic_clothing',
    layer: '5_Medic',
    type: EquippableTraitType.EQUIPPED_WEARABLE,
  },
  {
    name: 'Monk Clothing',
    description: 'Monk Clothing',
    thumbnail: 'THUMB__Monk_clothing',
    layer: '5_Monk',
    type: EquippableTraitType.EQUIPPED_WEARABLE,
  },
  {
    name: 'Mystic Alchemist Clothing',
    description: 'Mystic Alchemist Clothing',
    thumbnail: 'THUMB__MysticAlchemist_clothing',
    layer: '5_MysticAlchemist',
    type: EquippableTraitType.EQUIPPED_WEARABLE,
  },
  {
    name: 'Necromancer Clothing',
    description: 'Necromancer Clothing',
    thumbnail: 'THUMB__Necromancer_clothing',
    layer: '5_Necromancer',
    type: EquippableTraitType.EQUIPPED_WEARABLE,
  },
  {
    name: 'Paladin Clothing',
    description: 'Paladin Clothing',
    thumbnail: 'THUMB__Paladin_clothing',
    layer: '5_Paladin',
    type: EquippableTraitType.EQUIPPED_WEARABLE,
  },
  {
    name: 'Pirate Clothing',
    description: 'Pirate Clothing',
    thumbnail: 'THUMB__Pirate_clothing',
    layer: '5_Pirate',
    type: EquippableTraitType.EQUIPPED_WEARABLE,
  },
  {
    name: 'Ranger Clothing',
    description: 'Ranger Clothing',
    thumbnail: 'THUMB__Ranger_clothing',
    layer: '5_Ranger',
    type: EquippableTraitType.EQUIPPED_WEARABLE,
  },
  {
    name: 'Rogue Clothing',
    description: 'Rogue Clothing',
    thumbnail: 'THUMB__Rogue_clothing',
    layer: '5_Rogue',
    type: EquippableTraitType.EQUIPPED_WEARABLE,
  },
  {
    name: 'Scribe Clothing',
    description: 'Scribe Clothing',
    thumbnail: 'THUMB__Scribe_clothing',
    layer: '5_Scribe',
    type: EquippableTraitType.EQUIPPED_WEARABLE,
  },
  {
    name: 'Tavern Keeper Clothing',
    description: 'Tavern Keeper Clothing',
    thumbnail: 'THUMB__Tavernkeeper_clothing',
    layer: '5_TavernKeeper',
    type: EquippableTraitType.EQUIPPED_WEARABLE,
  },
  {
    name: 'Warrior Clothing',
    description: 'Warrior Clothing',
    thumbnail: 'THUMB__Warrior_clothing',
    layer: '5_Warrior',
    type: EquippableTraitType.EQUIPPED_WEARABLE,
  },
  {
    name: 'Wizard Clothing',
    description: 'Wizard Clothing',
    thumbnail: 'THUMB__Wizard_clothing',
    layer: '5_Wizard',
    type: EquippableTraitType.EQUIPPED_WEARABLE,
  },
  {
    name: 'Basic Sword',
    description: 'Basic Sword',
    thumbnail: 'THUMB__Basic_sword',
    layer: '7_BasicSword',
    type: EquippableTraitType.EQUIPPED_ITEM_2,
  },
  {
    name: 'Broken Brood',
    description: 'Broken Brood',
    thumbnail: 'THUMB__Broken_Brood',
    layer: '7_BrokenBrood',
    type: EquippableTraitType.EQUIPPED_ITEM_2,
  },
  {
    name: 'Hammer',
    description: 'Hammer',
    thumbnail: 'THUMB__Hammer',
    layer: '7_Hammer',
    type: EquippableTraitType.EQUIPPED_ITEM_2,
  },
  {
    name: 'Spikey',
    description: 'Spikey',
    thumbnail: 'THUMB__Spikey',
    layer: '7_Spikey',
    type: EquippableTraitType.EQUIPPED_ITEM_2,
  },
  {
    name: 'Stekahr Staff',
    description: 'Stekahr Staff',
    thumbnail: 'THUMB__Stekahr_Sceptre',
    layer: '7_StekahrStaff',
    type: EquippableTraitType.EQUIPPED_ITEM_2,
  },
  {
    name: 'Sword Of Undhur',
    description: 'Sword Of Undhur',
    thumbnail: 'THUMB__Sword_Of_Undhur',
    layer: '7_SwordOfUndhur',
    type: EquippableTraitType.EQUIPPED_ITEM_2,
  },
  {
    name: 'The Ghoul Slayer',
    description: 'The Ghoul Slayer',
    thumbnail: 'THUMB__The_Ghoul_Slayer',
    layer: '7_TheGhoulSlayer',
    type: EquippableTraitType.EQUIPPED_ITEM_2,
  },
];

export type ClassEmblem = {
  name: string;
  description: string;
  emblem: string;
};

export const DEFAULT_CLASSES: Array<ClassEmblem> = [
  {
    name: 'Alchemist',
    description: 'Alchemist',
    emblem: 'alchemist',
  },
  {
    name: 'Archer',
    description: 'Archer',
    emblem: 'archer',
  },
  {
    name: 'Cleric',
    description: 'Cleric',
    emblem: 'cleric',
  },
  {
    name: 'Druid',
    description: 'Druid',
    emblem: 'druid',
  },
  {
    name: 'Healer',
    description: 'Healer',
    emblem: 'healer',
  },
  {
    name: 'Hunter',
    description: 'Hunter',
    emblem: 'hunter',
  },
  {
    name: 'Monk',
    description: 'Monk',
    emblem: 'monk',
  },
  {
    name: 'Necromancer',
    description: 'Necromancer',
    emblem: 'necromancer',
  },
  {
    name: 'Paladin',
    description: 'Paladin',
    emblem: 'paladin',
  },
  {
    name: 'Rogue',
    description: 'Rogue',
    emblem: 'rogue',
  },
  {
    name: 'Scribe',
    description: 'Scribe',
    emblem: 'scribe',
  },
  {
    name: 'Tavern Keeper',
    description: 'Tavern Keeper',
    emblem: 'tavern_keeper',
  },
  {
    name: 'Warrior',
    description: 'Warrior',
    emblem: 'warrior',
  },
  {
    name: 'Wizard',
    description: 'Wizard',
    emblem: 'wizard',
  },
];

export const DEFAULT_TRAITS: TraitsArray = [
  '0_Clouds_a_64485b',
  '1_Type1_a_ccb5aa',
  '2_Type1_a_80a86c',
  '3_Bald_a_c5c3bb',
  '',
  '5_Villager1_a_796e68',
  '6_Basic_a',
  '',
];

export const LAYERS_URI =
  'ipfs://bafybeidfpt3earjjmrcbk4gcviupjp3a4b5vkx5ldhf5brioobtvbgzlni';

export const CLASS_URI =
  'ipfs://QmXnRUVsBgKZUcDzzqXN3BWhepjCggArkrxZiSqnp1JgYe';

export const TRAITS: { [key: number]: { [key: string]: string[] } } = {
  0: {
    clouds: ['0_Clouds_a_64485b', '0_Clouds_b_597f78'],
    hellfire: ['0_Hellfire_a_ca4850'],
  },
  1: {
    type1: [
      '1_Type1_a_ccb5aa',
      '1_Type1_b_c29c8a',
      '1_Type1_c_ac9a7c',
      '1_Type1_d_9e855c',
      '1_Type1_e_87584d',
      '1_Type1_f_5a393c',
      '1_Type1_g_452e2a',
      '1_Type1_h_361a18',
    ],
    type2: [
      '1_Type2_a_ccb5aa',
      '1_Type2_b_c29c8a',
      '1_Type2_c_ac9a7c',
      '1_Type2_d_9e855c',
      '1_Type2_e_87584d',
      '1_Type2_f_5a393c',
      '1_Type2_g_452e2a',
      '1_Type2_h_361a18',
    ],
  },
  2: {
    type1: [
      '2_Type1_a_80a86c',
      '2_Type1_b_cdcd82',
      '2_Type1_c_93c3cb',
      '2_Type1_d_897e50',
      '2_Type1_e_473a23',
      '2_Type1_f_f0cd82',
      '2_Type1_g_c94619',
    ],
    eyepatch: [
      '2_Eyepatch_a_80a86c',
      '2_Eyepatch_b_cdcd82',
      '2_Eyepatch_c_93c3cb',
      '2_Eyepatch_d_897e50',
      '2_Eyepatch_e_473a23',
      '2_Eyepatch_f_f0cd82',
      '2_Eyepatch_g_c94619',
    ],
    makeup: [
      '2_Makeup_a_80a86c',
      '2_Makeup_b_cdcd82',
      '2_Makeup_c_93c3cb',
      '2_Makeup_d_897e50',
      '2_Makeup_e_473a23',
      '2_Makeup_f_f0cd82',
      '2_Makeup_g_c94619',
    ],
    heavymakeup: [
      '2_Heavymakeup_a_80a86c',
      '2_Heavymakeup_b_cdcd82',
      '2_Heavymakeup_c_93c3cb',
      '2_Heavymakeup_d_897e50',
      '2_Heavymakeup_e_473a23',
      '2_Heavymakeup_f_f0cd82',
      '2_Heavymakeup_g_c94619',
    ],
  },
  3: {
    bald: [
      '3_Bald_a_c5c3bb',
      '3_Bald_b_e5d291',
      '3_Bald_c_b67f5e',
      '3_Bald_d_624a3c',
    ],
    fade: [
      '3_Fade_a_c5c3bb',
      '3_Fade_b_e5d291',
      '3_Fade_c_b67f5e',
      '3_Fade_d_624a3c',
      '3_Fade_e_272721',
    ],
    longhair: [
      '3_Longhair_a_c5c3bb',
      '3_Longhair_b_e5d291',
      '3_Longhair_c_b67f5e',
      '3_Longhair_d_624a3c',
      '3_Longhair_e_272721',
      '3_Longhair_f_ba2cb9',
      '3_Longhair_g_fefaea',
    ],
    mohawk: [
      '3_Mohawk_a_c5c3bb',
      '3_Mohawk_b_e5d291',
      '3_Mohawk_c_b67f5e',
      '3_Mohawk_d_624a3c',
      '3_Mohawk_e_272721',
      '3_Mohawk_f_f486f3',
      '3_Mohawk_g_87b8f1',
    ],
  },
  5: {
    villager1: ['5_Villager1_a_796e68'],
    villager2: ['5_Villager2_a_50434e'],
  },
  6: {
    basic: ['6_Basic_a'],
    bigbeard: [
      '6_Bigbeard_a_c5c3bb',
      '6_Bigbeard_b_e5d291',
      '6_Bigbeard_c_b67f5e',
      '6_Bigbeard_d_624a3c',
      '6_Bigbeard_e_272721',
    ],
    handlebars: [
      '6_Handlebars_a_c5c3bb',
      '6_Handlebars_b_e5d291',
      '6_Handlebars_c_b67f5e',
      '6_Handlebars_d_624a3c',
      '6_Handlebars_e_272721',
    ],
    lipstick: [
      '6_Lipstick_a_b67f5d',
      '6_Lipstick_b_c96f82',
      '6_Lipstick_c_d8695b',
      '6_Lipstick_d_551cc8',
      '6_Lipstick_e_2b1937',
    ],
  },
};

export const removeTraitHex = (trait: string): string => {
  const traitSplit = trait.split('_');
  if (traitSplit.length <= 3) return trait;
  return traitSplit[0] + '_' + traitSplit[1] + '_' + traitSplit[2];
};

export const getImageIpfsUri = (fileName: string): string => {
  if (!fileName) return '';
  return LAYERS_URI + '/' + fileName + '.png';
};

export const getThumbnailUrl = (fileName: string): string => {
  return uriToHttp(LAYERS_URI)[0] + '/' + fileName + '.png';
};

export const getClassEmblemUrl = (fileName: string): string => {
  return uriToHttp(CLASS_URI)[0] + '/' + fileName + '.svg';
};

export const getClassIpfsUri = (fileName: string): string => {
  return CLASS_URI + '/' + fileName + '.svg';
};

export const getImageUrl = (fileName: string): string => {
  if (fileName.startsWith('THUMB')) {
    return getThumbnailUrl(fileName);
  }
  const [index] = fileName.split('_');
  if (index.includes('equip')) {
    // We want to take everything after the second underscore, even if it contains more underscores
    const potentialUrl = fileName.split('_').slice(2).join('_');
    return potentialUrl; // In this case, what would normally be "color" is actually the URL of the newly equipped item
  }

  return uriToHttp(LAYERS_URI)[0] + '/' + removeTraitHex(fileName) + '.png';
};

export const formatLayerNameFromTrait = (
  traitType: BaseTraitType,
  trait: string,
): string => {
  const [variant, color] = trait.split(' ');
  return `${traitPositionToIndex(traitType)}_${capitalize(
    variant,
  )}_${color.toLowerCase()}`;
};

export const getTraitsObjectFromAttributes = (
  attributes: Attribute[],
): CharacterTraits => {
  const characterTraits: CharacterTraits = {
    [BaseTraitType.BACKGROUND]: '',
    [BaseTraitType.BODY]: '',
    [BaseTraitType.EYES]: '',
    [BaseTraitType.HAIR]: '',
    [BaseTraitType.CLOTHING]: '',
    [BaseTraitType.MOUTH]: '',
    [EquippableTraitType.EQUIPPED_ITEM_1]: '',
    [EquippableTraitType.EQUIPPED_WEARABLE]: '',
    [EquippableTraitType.EQUIPPED_ITEM_2]: '',
  };

  attributes.forEach(attribute => {
    if (!attribute.value) return;
    switch (attribute.trait_type) {
      case BaseTraitType.BACKGROUND:
        characterTraits[BaseTraitType.BACKGROUND] = formatLayerNameFromTrait(
          BaseTraitType.BACKGROUND,
          attribute.value,
        );
        break;
      case BaseTraitType.BODY:
        characterTraits[BaseTraitType.BODY] = formatLayerNameFromTrait(
          BaseTraitType.BODY,
          attribute.value,
        );
        break;
      case BaseTraitType.EYES:
        characterTraits[BaseTraitType.EYES] = formatLayerNameFromTrait(
          BaseTraitType.EYES,
          attribute.value,
        );
        break;
      case BaseTraitType.HAIR:
        characterTraits[BaseTraitType.HAIR] = formatLayerNameFromTrait(
          BaseTraitType.HAIR,
          attribute.value,
        );
        break;
      case EquippableTraitType.EQUIPPED_ITEM_1:
        characterTraits[EquippableTraitType.EQUIPPED_ITEM_1] = attribute.value;
        break;
      case BaseTraitType.CLOTHING:
        characterTraits[BaseTraitType.CLOTHING] = formatLayerNameFromTrait(
          BaseTraitType.CLOTHING,
          attribute.value,
        );
        break;
      case EquippableTraitType.EQUIPPED_WEARABLE:
        characterTraits[EquippableTraitType.EQUIPPED_WEARABLE] =
          attribute.value;
        break;
      case BaseTraitType.MOUTH:
        characterTraits[BaseTraitType.MOUTH] = formatLayerNameFromTrait(
          BaseTraitType.MOUTH,
          attribute.value,
        );
        break;
      case EquippableTraitType.EQUIPPED_ITEM_2:
        characterTraits[EquippableTraitType.EQUIPPED_ITEM_2] = attribute.value;
        break;
      default:
        break;
    }
  });

  return characterTraits;
};

export const traitPositionToIndex = (
  position: BaseTraitType | EquippableTraitType,
): number => {
  switch (position) {
    case BaseTraitType.BACKGROUND:
      return 0;
    case BaseTraitType.BODY:
      return 1;
    case BaseTraitType.EYES:
      return 2;
    case BaseTraitType.HAIR:
      return 3;
    case EquippableTraitType.EQUIPPED_ITEM_1:
      return 4;
    case BaseTraitType.CLOTHING:
      return 5;
    case EquippableTraitType.EQUIPPED_WEARABLE:
      return 5;
    case BaseTraitType.MOUTH:
      return 6;
    case EquippableTraitType.EQUIPPED_ITEM_2:
      return 7;
    default:
      return 5;
  }
};

export const getAttributesFromTraitsObject = (
  traits: CharacterTraits,
): Attribute[] => {
  return Object.keys(traits).map(trait => {
    const traitType = trait as BaseTraitType | EquippableTraitType;
    const [index, variant, color] = traits[traitType].split('_');

    if (index.includes('equip')) {
      return {
        trait_type: traitType,
        value: variant.toUpperCase(), // In this case, the "variant" is the name of the equippable item
      };
    } else if (!(index && variant && color)) {
      return {
        trait_type: traitType,
        value: '',
      };
    }
    return {
      trait_type: traitType,
      value: `${variant.toUpperCase()} ${color.toUpperCase()}`,
    };
  });
};

export const getEquippableTraitName = (
  equippableTraitType: EquippableTraitType,
  items: Item[],
  traits: CharacterTraits,
): CharacterTraits => {
  if (
    items[0]?.equippable_layer &&
    !traits[equippableTraitType].includes('equip')
  ) {
    if (traits[equippableTraitType].includes('remove')) {
      const [, name, image] = traits[equippableTraitType].split('_');

      if (items[0].name === name && items[0].equippable_layer === image) {
        traits[equippableTraitType] = items[1]
          ? `equip_${items[1].name}_${items[1].equippable_layer}`
          : '';
      } else {
        traits[equippableTraitType] =
          `equip_${items[0].name}_${items[0].equippable_layer}`;
      }
    } else {
      traits[equippableTraitType] =
        `equip_${items[0].name}_${items[0].equippable_layer}`;
    }
  }

  return traits;
};

export const formatTraitsForUpload = async (
  traits: CharacterTraits,
  chainId?: number,
  extendedCharacterId?: string,
): Promise<string[] | null> => {
  try {
    // If extendedCharacterId and chainId are not provided, then a new character is being created
    if (extendedCharacterId && chainId) {
      const { data, error } = await getGraphClient(chainId).query(
        GetCharacterInfoByIdDocument,
        {
          characterId: extendedCharacterId.toLowerCase(),
        },
      );

      if (error) {
        console.error('Error getting character info', error);
        throw new Error('Error getting character info');
      }

      const unformattedCharacter =
        data?.character as CharacterInfoFragment | null;
      if (!unformattedCharacter) throw new Error('Character not found');

      const items = await Promise.all(
        unformattedCharacter.equippedItems.map(equippedItem =>
          formatItem(equippedItem.item),
        ),
      );

      const character = await formatCharacter(unformattedCharacter, [], items);

      const equippedItem1s = character.equippedItems
        .filter(
          i =>
            i.attributes &&
            i.attributes[0]?.value === EquippableTraitType.EQUIPPED_ITEM_1,
        )
        .sort((a, b) => {
          if (!a.equippedAt || !b.equippedAt) return 0;
          return b.equippedAt - a.equippedAt;
        });

      const equippedWearables = character.equippedItems
        .filter(
          i =>
            i.attributes &&
            i.attributes[0]?.value === EquippableTraitType.EQUIPPED_WEARABLE,
        )
        .sort((a, b) => {
          if (!a.equippedAt || !b.equippedAt) return 0;
          return b.equippedAt - a.equippedAt;
        });

      const equippedItem2s = character.equippedItems
        .filter(
          i =>
            i.attributes &&
            i.attributes[0]?.value === EquippableTraitType.EQUIPPED_ITEM_2,
        )
        .sort((a, b) => {
          if (!a.equippedAt || !b.equippedAt) return 0;
          return b.equippedAt - a.equippedAt;
        });

      traits = getEquippableTraitName(
        EquippableTraitType.EQUIPPED_ITEM_1,
        equippedItem1s,
        traits,
      );

      traits = getEquippableTraitName(
        EquippableTraitType.EQUIPPED_WEARABLE,
        equippedWearables,
        traits,
      );

      traits = getEquippableTraitName(
        EquippableTraitType.EQUIPPED_ITEM_2,
        equippedItem2s,
        traits,
      );
    }

    const traitsArray: TraitsArray = ['', '', '', '', '', '', '', ''];
    Object.keys(traits).forEach(traitType => {
      const trait = traits[traitType as keyof CharacterTraits];
      const index = traitPositionToIndex(traitType as keyof CharacterTraits);

      if (
        traitType === BaseTraitType.CLOTHING &&
        !!traits[EquippableTraitType.EQUIPPED_WEARABLE]
      ) {
        return;
      }

      if (!trait) return;
      traitsArray[index] = trait;
    });

    return traitsArray.filter(trait => trait !== '');
  } catch (e) {
    console.error(e);
    return null;
  }
};
