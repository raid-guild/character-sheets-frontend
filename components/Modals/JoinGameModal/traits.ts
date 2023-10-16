import { uriToHttp } from '@/utils/helpers';

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

export const TRAITS = [
  '0_Clouds_a',
  '0_Clouds_b',
  '0_Hellfire_a',
  '1_Type1_a',
  '1_Type1_b',
  '1_Type1_c',
  '1_Type1_d',
  '1_Type1_e',
  '1_Type1_f',
  '1_Type1_g',
  '1_Type1_h',
  '1_Type2_a',
  '1_Type2_b',
  '1_Type2_c',
  '1_Type2_d',
  '1_Type2_e',
  '1_Type2_f',
  '1_Type2_g',
  '1_Type2_h',
  '2_Eyepatch_a',
  '2_Eyepatch_b',
  '2_Eyepatch_c',
  '2_Eyepatch_d',
  '2_Eyepatch_e',
  '2_Eyepatch_f',
  '2_Eyepatch_g',
  '2_Heavymakeup_a',
  '2_Heavymakeup_b',
  '2_Heavymakeup_c',
  '2_Heavymakeup_d',
  '2_Heavymakeup_e',
  '2_Heavymakeup_f',
  '2_Heavymakeup_g',
  '2_Makeup_a',
  '2_Makeup_b',
  '2_Makeup_c',
  '2_Makeup_d',
  '2_Makeup_e',
  '2_Makeup_f',
  '2_Makeup_g',
  '2_Type1_a',
  '2_Type1_b',
  '2_Type1_c',
  '2_Type1_d',
  '2_Type1_e',
  '2_Type1_f',
  '2_Type1_g',
  '3_Bald_a',
  '3_Bald_b',
  '3_Bald_c',
  '3_Bald_d',
  '3_Fade_a',
  '3_Fade_b',
  '3_Fade_c',
  '3_Fade_d',
  '3_Fade_e',
  '3_Longhair_a',
  '3_Longhair_b',
  '3_Longhair_c',
  '3_Longhair_d',
  '3_Longhair_e',
  '3_Longhair_f',
  '3_Longhair_g',
  '3_Mohawk_a',
  '3_Mohawk_b',
  '3_Mohawk_c',
  '3_Mohawk_d',
  '3_Mohawk_e',
  '3_Mohawk_f',
  '3_Mohawk_g',
  '5_Villager1_a',
  '5_Villager2_a',
  '6_Basic_a',
  '6_Bigbeard_a',
  '6_Bigbeard_b',
  '6_Bigbeard_c',
  '6_Bigbeard_d',
  '6_Bigbeard_e',
  '6_Handlebars_a',
  '6_Handlebars_b',
  '6_Handlebars_c',
  '6_Handlebars_d',
  '6_Handlebars_e',
  '6_Lipstick_a',
  '6_Lipstick_b',
  '6_Lipstick_c',
  '6_Lipstick_d',
  '6_Lipstick_e',
];

export const BACKGROUND_TRAITS = Object.values(TRAITS).filter(
  trait => trait.split('_')[0] === '0',
);

export const BODY_TRAITS = Object.values(TRAITS).filter(
  trait => trait.split('_')[0] === '1',
);

export const EYES_TRAITS = Object.values(TRAITS).filter(
  trait => trait.split('_')[0] === '2',
);

export const HAIR_TRAITS = Object.values(TRAITS).filter(
  trait => trait.split('_')[0] === '3',
);

export const CLOTHING_TRAITS = Object.values(TRAITS).filter(
  trait => trait.split('_')[0] === '5',
);

export const MOUTH_TRAITS = Object.values(TRAITS).filter(
  trait => trait.split('_')[0] === '6',
);

export const getImageUrl = (fileName: string): string => {
  return uriToHttp(LAYERS_CID)[0] + 'layers/' + fileName + '.png';
};
