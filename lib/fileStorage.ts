import { Web3Storage } from 'web3.storage';

const WEB3STORAGE_TOKEN = process.env.WEB3STORAGE_TOKEN;

if (!WEB3STORAGE_TOKEN) {
  throw new Error(`Invalid/Missing environment variable: "WEB3STORAGE_TOKEN"`);
}

export const uploadToWeb3Storage = async (file: File): Promise<string> => {
  const client = new Web3Storage({
    token: WEB3STORAGE_TOKEN,
  });

  return await client.put([file], {
    maxRetries: 3,
  });
};
