const HOSTNAME =
  typeof window !== 'undefined' ? window.location.hostname : 'localhost';

const RAIDGUILD_HOSTNAME = process.env.NEXT_PUBLIC_RAIDGUILD_HOSTNAME;

const RAIDGUILD_GAME_ADDRESS = process.env.NEXT_PUBLIC_RAIDGUILD_GAME_ADDRESS;

const RAIDGUILD_GAME_CHAIN_LABEL =
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

if (!ENVIRONMENT || !['main', 'dev'].includes(ENVIRONMENT)) {
  throw new Error('NEXT_PUBLIC_ENVIRONMENT is not set');
}
