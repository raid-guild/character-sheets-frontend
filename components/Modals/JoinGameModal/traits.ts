import { uriToHttp } from '@/utils/helpers';

export enum TraitType {
  BODY = 'BODY',
  EYES = 'EYES',
  HAIR = 'HAIR',
  CLOTHING = 'CLOTHING',
  MOUTH = 'MOUTH',
}

export type Trait = {
  color: string;
  image: string;
  trait_type: TraitType;
  variation: string;
  z_index: number;
};

export const TRAITS: { [key: string]: Trait } = {
  ['1_Basic_a']: {
    color: 'a',
    image: 'ipfs://bafybeicnc3rzdxw2nsbowpdcdlo34cblcz7whirop4pbzxelrfgzxnqd6e',
    trait_type: TraitType.BODY,
    variation: 'Basic',
    z_index: 1,
  },
  ['1_Basic_b']: {
    color: 'b',
    image: 'ipfs://bafybeig527xcplwcorz7tt37cgzvtdxpfods7k53iqvnkfa2iyfpmeaoya',
    trait_type: TraitType.BODY,
    variation: 'Basic',
    z_index: 1,
  },
  ['1_Basic_c']: {
    color: 'c',
    image: 'ipfs://bafybeihw4axwi52gowhcm6kwcp556tgjajeo7yfrjc3zdffedqogs3psxi',
    trait_type: TraitType.BODY,
    variation: 'Basic',
    z_index: 1,
  },
  ['2_Basic_a']: {
    color: 'a',
    image: 'ipfs://bafybeiftylpxbsgfl552g5u5xptko4wyb6clm67xli2uo3ckkgzsuxpnea',
    trait_type: TraitType.EYES,
    variation: 'Basic',
    z_index: 2,
  },
  ['2_Basic_b']: {
    color: 'b',
    image: 'ipfs://bafybeih4imygm5kpzxydd7qxsefeim7hymvlty3h2apmhtp5wpq47kyh4q',
    trait_type: TraitType.EYES,
    variation: 'Basic',
    z_index: 2,
  },
  ['2_Basic_c']: {
    color: 'c',
    image: 'ipfs://bafybeih4qixkcaeshniknx2wvto2vmyare7djgz2nkfprlkqqfinds7c3e',
    trait_type: TraitType.EYES,
    variation: 'Basic',
    z_index: 2,
  },
  ['2_HeavyMakeup_a']: {
    color: 'a',
    image: 'ipfs://bafybeid2sx5q25zguscozkaw3w4pmpoputtvech4o62o5chv5v4pjxhe54',
    trait_type: TraitType.EYES,
    variation: 'HeavyMakeup',
    z_index: 2,
  },
  ['2_HeavyMakeup_b']: {
    color: 'b',
    image: 'ipfs://bafybeih4agczltag452hkypl6lvdmexat3l56uvetpse7s3dzi6ds2vfim',
    trait_type: TraitType.EYES,
    variation: 'HeavyMakeup',
    z_index: 2,
  },
  ['2_Eyepatch_a']: {
    color: 'a',
    image: 'ipfs://bafybeiclhqc5u7q4wvmsgedwjnefeubqwwehp7uh56665zbeqsc6c225dm',
    trait_type: TraitType.EYES,
    variation: 'Eyepatch',
    z_index: 2,
  },
  ['3_Bald_a']: {
    color: 'a',
    image: 'ipfs://bafybeiexsv7aupulmhdlgzxr2mgxr5kxbgo4jnxh52nr7cgzxy4cxrlfhi',
    trait_type: TraitType.HAIR,
    variation: 'Bald',
    z_index: 3,
  },
  ['3_Bald_b']: {
    color: 'b',
    image: 'ipfs://bafybeiddvop6oyvbxonetqzt5fwvzl5jitvg4gfadhpjn4x7ld23wxhyti',
    trait_type: TraitType.HAIR,
    variation: 'Bald',
    z_index: 3,
  },
  ['3_Bald_c']: {
    color: 'c',
    image: 'ipfs://bafybeif3vjyxtoixtxehpnzgbrqpchuwwninkmnvn3qdzl45ngxnkxotwy',
    trait_type: TraitType.HAIR,
    variation: 'Bald',
    z_index: 3,
  },
  ['3_Buzzcut_a']: {
    color: 'a',
    image: 'ipfs://bafybeibnva5uhwgv2iqmwqiw4mnpouw6g27xdxrymmbbgduxe53i5cbf7a',
    trait_type: TraitType.HAIR,
    variation: 'Buzzcut',
    z_index: 3,
  },
  ['3_Buzzcut_b']: {
    color: 'b',
    image: 'ipfs://bafybeigsghqfhzckefg6ax5wekqunj2g4clmlndzxv6zuvudf4z2qtgkk4',
    trait_type: TraitType.HAIR,
    variation: 'Buzzcut',
    z_index: 3,
  },
  ['3_Buzzcut_c']: {
    color: 'c',
    image: 'ipfs://bafybeiaozjxm3gfaovjqcwqeufxjzaqlf3yllch67bbtkjd5lg72a5ksx4',
    trait_type: TraitType.HAIR,
    variation: 'Buzzcut',
    z_index: 3,
  },
  ['3_Longhair_a']: {
    color: 'a',
    image: 'ipfs://bafybeibdos7igifttfb43lbecb3saeci5wa5cavpcaqxfzolxce5t7gara',
    trait_type: TraitType.HAIR,
    variation: 'Longhair',
    z_index: 3,
  },
  ['3_Longhair_b']: {
    color: 'b',
    image: 'ipfs://bafybeidots3f2tztf2nqzwgfdddviqiunuk56lcuwbkau25nr74icxsdxa',
    trait_type: TraitType.HAIR,
    variation: 'Longhair',
    z_index: 3,
  },
  ['3_Longhair_c']: {
    color: 'c',
    image: 'ipfs://bafybeibahajp5sk2qendcv4aniidzdw4udldbjol4wizb4k6a6wag2f63u',
    trait_type: TraitType.HAIR,
    variation: 'Longhair',
    z_index: 3,
  },
  ['3_Mohawk_a']: {
    color: 'a',
    image: 'ipfs://bafybeif2rgr3d3mw54rhkoouh4n6uqrg7lag2q2opzj5lyspesjzn3ecdi',
    trait_type: TraitType.HAIR,
    variation: 'Mohawk',
    z_index: 3,
  },
  ['3_Mohawk_b']: {
    color: 'b',
    image: 'ipfs://bafybeidg5jcwcenas532ffapbhmm2ktxrbdoz3qm3pdhoptbqyw5uaeoja',
    trait_type: TraitType.HAIR,
    variation: 'Mohawk',
    z_index: 3,
  },
  ['3_Mohawk_c']: {
    color: 'c',
    image: 'ipfs://bafybeih5kuedijli5tsna2us3y5iiugc77hzil573v5b6gsmqqyvbgdhyy',
    trait_type: TraitType.HAIR,
    variation: 'Mohawk',
    z_index: 3,
  },
  // TODO: In the future this will probably be replaced by a masculine/feminine villager outfit
  ['4_Archer_a']: {
    color: 'a',
    image: 'ipfs://bafybeiadbdcl6macxeqtjusxtkvesnur5fwb3m5clbaxz6nthqefwq624e',
    trait_type: TraitType.CLOTHING,
    variation: 'Archer',
    z_index: 4,
  },
  ['5_Basic_a']: {
    color: 'a',
    image: 'ipfs://bafybeidysol5f35ln23nxyf2iyco7mukg3gedluvf6x3pzxvmyhe3y2hia',
    trait_type: TraitType.MOUTH,
    variation: 'Basic',
    z_index: 5,
  },
  ['5_Bigbeard_a']: {
    color: 'a',
    image: 'ipfs://bafybeig6gk4j44ipgbmsjy2mazoxuwdiyttgtv62ivp65xwnlklwn4miga',
    trait_type: TraitType.MOUTH,
    variation: 'Bigbeard',
    z_index: 5,
  },
  ['5_Bigbeard_b']: {
    color: 'b',
    image: 'ipfs://bafybeiccugvz7qqovvqn5nlyiwuo6qdyrokn4k24wk2vago4xhtv2dhzx4',
    trait_type: TraitType.MOUTH,
    variation: 'Bigbeard',
    z_index: 5,
  },
  ['5_Handlebars_a']: {
    color: 'a',
    image: 'ipfs://bafybeihmjxm66wjjtcicybk5r5eatnkaeoase7q67tkkdff3q5lgfceli4',
    trait_type: TraitType.MOUTH,
    variation: 'Handlebars',
    z_index: 5,
  },
  ['5_Handlebars_b']: {
    color: 'b',
    image: 'ipfs://bafybeic35psjwuiz6cbwvhh77pfiligx3kaxguhhh6pdr2lvidxh3vrili',
    trait_type: TraitType.MOUTH,
    variation: 'Handlebars',
    z_index: 5,
  },
  ['5_Lipstick_a']: {
    color: 'a',
    image: 'ipfs://bafybeidgip2dgpxrrabtc3mjihxkmryesw6i4yslnz7lkcvbbriygk6aiy',
    trait_type: TraitType.MOUTH,
    variation: 'Lipstick',
    z_index: 5,
  },
  ['5_Lipstick_b']: {
    color: 'b',
    image: 'ipfs://bafybeid4q5l2p5osm2qr6f6vaxnh42tmwzb2rqm4dogf6cti6wfwgbd3zi',
    trait_type: TraitType.MOUTH,
    variation: 'Lipstick',
    z_index: 5,
  },
};

export const BODY_TRAITS = Object.values(TRAITS).filter(
  trait => trait.trait_type === TraitType.BODY,
);

export const EYES_TRAITS = Object.values(TRAITS).filter(
  trait => trait.trait_type === TraitType.EYES,
);

export const HAIR_TRAITS = Object.values(TRAITS).filter(
  trait => trait.trait_type === TraitType.HAIR,
);

export const CLOTHING_TRAITS = Object.values(TRAITS).filter(
  trait => trait.trait_type === TraitType.CLOTHING,
);

export const MOUTH_TRAITS = Object.values(TRAITS).filter(
  trait => trait.trait_type === TraitType.MOUTH,
);

export const formatFileName = (trait: Trait): string =>
  `${trait.z_index}_${trait.variation}_${trait.color}`;

export const getImageUrl = (trait: Trait): string => {
  const fileName = formatFileName(trait);
  return uriToHttp(trait.image)[0] + fileName + '.png';
};
