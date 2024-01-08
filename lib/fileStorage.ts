import pinataSDK, { PinataPinOptions } from '@pinata/sdk';
import { Readable } from 'stream';
import { Web3Storage } from 'web3.storage';

const WEB3STORAGE_TOKEN = process.env.WEB3STORAGE_TOKEN;
const PINATA_JWT = process.env.PINATA_JWT;

if (!WEB3STORAGE_TOKEN) {
  throw new Error(`Invalid/Missing environment variable: "WEB3STORAGE_TOKEN"`);
}

if (!PINATA_JWT) {
  throw new Error(`Invalid/Missing environment variable: "PINATA_JWT"`);
}

export const uploadToWeb3Storage = async (file: File): Promise<string> => {
  try {
    const client = new Web3Storage({
      token: WEB3STORAGE_TOKEN,
    });

    return await client.put([file], {
      maxRetries: 3,
      wrapWithDirectory: false,
    });
  } catch (error) {
    console.error(error);
    return '';
  }
};

const bufferToStream = (buffer: Buffer) => {
  const readable = new Readable();
  readable._read = () => {};
  readable.push(buffer);
  readable.push(null);
  return readable;
};

export const uploadToPinata = async (
  file: Buffer,
  fileName: string,
): Promise<string> => {
  try {
    const pinata = new pinataSDK({ pinataJWTKey: PINATA_JWT });
    const readableStreamForFile = bufferToStream(file);
    const options: PinataPinOptions = {
      pinataMetadata: {
        name: fileName,
      },
    };

    const response = await pinata.pinFileToIPFS(readableStreamForFile, options);
    const { IpfsHash } = response;
    if (!IpfsHash) {
      throw new Error('Error pinning file to IPFS');
    }

    return IpfsHash;
  } catch (error) {
    console.error(error);
    return '';
  }
};
