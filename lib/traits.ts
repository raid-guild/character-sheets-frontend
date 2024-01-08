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

export const LAYERS_CID =
  'ipfs://bafybeifbgpsf4hr53ifk646xrxsvg33toq7fqktzqupcdz6cin3ifkvzxq';

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
  return traitSplit[0] + '_' + traitSplit[1] + '_' + traitSplit[2];
};

export const getImageUrl = (fileName: string): string => {
  const [index, , potentialUrl] = fileName.split('_');
  if (index.includes('equip')) {
    return potentialUrl; // In this case, what would normally be "color" is actually the URL of the newly equipped item
  }

  return (
    uriToHttp(LAYERS_CID)[0] + '/layers/' + removeTraitHex(fileName) + '.png'
  );
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
        traits[
          equippableTraitType
        ] = `equip_${items[0].name}_${items[0].equippable_layer}`;
      }
    } else {
      traits[
        equippableTraitType
      ] = `equip_${items[0].name}_${items[0].equippable_layer}`;
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
