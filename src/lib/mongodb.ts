export type { Document } from 'mongodb';
export { MongoClient, Db, Collection } from 'mongodb';
import { MongoClient, Db, Collection, Document } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Boniface:nb9ms2AYs7mBH.N@cluster0.szukiim.mongodb.net/?appName=Cluster0';
const DB_NAME = process.env.DB_NAME || 'githirioni-shg';

interface MongoDBConnection {
  client: MongoClient;
  db: Db;
}

let cachedConnection: MongoDBConnection | null = null;

export async function connectToDatabase(): Promise<MongoDBConnection> {
  if (cachedConnection) {
    return cachedConnection;
  }

  const client = new MongoClient(MONGODB_URI, {
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 30000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 5000,
    retryWrites: true,
    retryReads: true,
    w: 'majority',
    readPreference: 'primary',
  });

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    
    console.log(`Connected to MongoDB: ${DB_NAME}`);
    
    cachedConnection = { client, db };
    return cachedConnection;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function closeDatabaseConnection(): Promise<void> {
  if (cachedConnection) {
    await cachedConnection.client.close();
    cachedConnection = null;
    console.log('MongoDB connection closed');
  }
}

export function getDatabase(): Db {
  if (!cachedConnection) {
    throw new Error('Database not connected. Call connectToDatabase() first.');
  }
  return cachedConnection.db;
}

export function getCollection<T extends Document>(name: string): Collection<T> {
  return getDatabase().collection<T>(name);
}

export async function runTransaction<T>(
  callback: (session: import('mongodb').ClientSession) => Promise<T>
): Promise<T> {
  if (!cachedConnection) {
    throw new Error('Database not connected');
  }
  
  const session = cachedConnection.client.startSession();
  
  try {
    const result = await session.withTransaction(async () => {
      return await callback(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}

if (process.env.NODE_ENV !== 'production') {
  (global as unknown as { mongoose?: unknown }).mongoose = { conn: null };
}