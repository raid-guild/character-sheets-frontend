export const HOSTNAME =
  typeof window !== 'undefined' ? window.location.hostname : 'localhost';

export const RAIDGUILD_HOSTNAME = process.env.NEXT_PUBLIC_RAIDGUILD_HOSTNAME;

export const RAIDGUILD_GAME_ADDRESS =
  process.env.NEXT_PUBLIC_RAIDGUILD_GAME_ADDRESS;
