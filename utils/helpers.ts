/**
 * Given a URI that may be ipfs, ipns, http, https, ar, or data protocol, return the fetch-able http(s) URLs for the same content
 * @param uri to convert to fetch-able http url
 */
export const uriToHttp = (uri: string): string[] => {
  try {
    const protocol = uri.split(':')[0].toLowerCase();
    switch (protocol) {
      case 'data':
        return [uri];
      case 'https':
        return [uri];
      case 'http':
        return ['https' + uri.substr(4), uri];
      case 'ipfs': {
        const hash = uri.match(/^ipfs:(\/\/)?(.*)$/i)?.[2];
        return [
          `https://ipfs.io/ipfs/${hash}/`,
          `https://cloudflare-ipfs.com/ipfs/${hash}/`,
        ];
      }
      case 'ipns': {
        const name = uri.match(/^ipns:(\/\/)?(.*)$/i)?.[2];
        return [
          `https://ipfs.io/ipns/${name}/`,
          `https://cloudflare-ipfs.com/ipns/${name}/`,
        ];
      }
      case 'ar': {
        const tx = uri.match(/^ar:(\/\/)?(.*)$/i)?.[2];
        return [`https://arweave.net/${tx}`];
      }
      default:
        return [];
    }
  } catch (e) {
    console.error(e);
    return ['', ''];
  }
};

export const shortenAddress = (address: string, chars = 4): string => {
  return `${address.slice(0, chars + 2)}...${address.slice(
    address.length - chars,
  )}`;
};

export const shortenText = (text: string, length: number): string => {
  if (text.length <= length) {
    return text;
  }

  return `${text.slice(0, length)}...`;
};

export const timeout = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
