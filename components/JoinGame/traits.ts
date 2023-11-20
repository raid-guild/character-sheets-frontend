import { uriToHttp } from '@/utils/helpers';

export type Traits = [string, string, string, string, string, string];

export enum TraitType {
  BACKGROUND = 'BACKGROUND',
  BODY = 'BODY',
  EYES = 'EYES',
  HAIR = 'HAIR',
  CLOTHING = 'CLOTHING',
  MOUTH = 'MOUTH',
}

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
  4: {
    villager1: ['5_Villager1_a_796e68'],
    villager2: ['5_Villager2_a_50434e'],
  },
  5: {
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
  return (
    uriToHttp(LAYERS_CID)[0] + '/layers/' + removeTraitHex(fileName) + '.png'
  );
};
