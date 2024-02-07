// Required for BigInt serialization
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

export { SUPPORTED_CHAINS } from './constants';
export * from './helpers';
export * from './readClients';
