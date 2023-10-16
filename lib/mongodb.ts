import { Db, MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

if (!process.env.MONGODB_DB) {
  throw new Error('Please define the MONGODB_DB environment variable');
}

declare const global: {
  _mongoClientPromise: Promise<MongoClient>;
  _mongoDbPromise: Promise<Db>;
};

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

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
