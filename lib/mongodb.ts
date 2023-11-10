import { Db, MongoClient } from 'mongodb';

import { ENVIRONMENT } from '@/utils/constants';

if (!process.env.MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

declare const global: {
  _mongoClientPromise: Promise<MongoClient>;
  _mongoDbPromise: Promise<Db>;
};

const uri = process.env.MONGODB_URI;
const dbName = (() => {
  switch (ENVIRONMENT) {
    case 'main':
      return 'character-sheets-prod';
    case 'dev':
    default:
      return 'character-sheets-dev';
  }
})();

let clientPromise: Promise<MongoClient>;
let dbPromise: Promise<Db>;

const createClientPromise = async (): Promise<MongoClient> => {
  const client = new MongoClient(uri, {});

  await client.connect();
  return client;
};

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = createClientPromise();
  }
  clientPromise = global._mongoClientPromise;
  dbPromise = global._mongoClientPromise.then(client => client.db(dbName));
} else {
  clientPromise = createClientPromise();
  dbPromise = clientPromise.then(client => client.db(dbName));
}

export { clientPromise, dbPromise };
