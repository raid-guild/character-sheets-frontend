import { uriToHttp } from './helpers';

const HOSTNAME =
  typeof window !== 'undefined' ? window.location.hostname : 'localhost';

const RAIDGUILD_HOSTNAME = process.env.NEXT_PUBLIC_RAIDGUILD_HOSTNAME;

export const RAIDGUILD_GAME_ADDRESS =
  process.env.NEXT_PUBLIC_RAIDGUILD_GAME_ADDRESS;

export const RAIDGUILD_GAME_CHAIN_LABEL =
  process.env.NEXT_PUBLIC_RAIDGUILD_GAME_CHAIN_LABEL;

export const RAIDGUILD_GAME_URL =
  HOSTNAME === RAIDGUILD_HOSTNAME &&
    RAIDGUILD_GAME_ADDRESS &&
    RAIDGUILD_GAME_CHAIN_LABEL
    ? `/games/${RAIDGUILD_GAME_CHAIN_LABEL}/${RAIDGUILD_GAME_ADDRESS}`
    : '';

export const ENVIRONMENT = (process.env.NEXT_PUBLIC_ENVIRONMENT || 'dev') as
  | 'main'
  | 'dev';

const DEV_BASE_CHARACTER_URI =
  process.env.NEXT_PUBLIC_BASE_CHARACTER_URI ||
  'https://dev.charactersheets.io/api/characters/';

export const BASE_CHARACTER_URI =
  ENVIRONMENT === 'main'
    ? 'https://charactersheets.io/api/characters/'
    : DEV_BASE_CHARACTER_URI;

if (!ENVIRONMENT || !['main', 'dev'].includes(ENVIRONMENT)) {
  throw new Error('NEXT_PUBLIC_ENVIRONMENT is not set');
}

export const JAILED_CHARACTER_CID =
  'QmSa8YUZnAJM6YjrwoC9JTDtCVYDi6saS9fuzPCSiqaWQn';

export const JAILED_CHARACTER_IMAGE_URLS = uriToHttp(
  `ipfs://${JAILED_CHARACTER_CID}`,
);

export const MAX_CLASS_LEVEL = 20;

export const EXPERIENCE_TO_LEVEL_MAP: { [key: number]: number } = {
  1: 0,
  2: 300,
  3: 900,
  4: 2700,
  5: 6500,
  6: 14000,
  7: 23000,
  8: 34000,
  9: 48000,
  10: 64000,
  11: 85000,
  12: 100000,
  13: 120000,
  14: 140000,
  15: 165000,
  16: 195000,
  17: 225000,
  18: 265000,
  19: 305000,
  20: 355000,
};
