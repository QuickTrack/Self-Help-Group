import { MongoClient, Db } from 'mongodb';

const localUri = 'mongodb://localhost:27017/selfhelp';
const atlasUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/githirioni-shg';

async function migrateCollections() {
  const localClient = new MongoClient(localUri);
  const atlasClient = new MongoClient(atlasUri);

  try {
    console.log('Connecting to local MongoDB...');
    await localClient.connect();
    const localDb = localClient.db();

    console.log('Connecting to Atlas...');
    await atlasClient.connect();
    const atlasDb = atlasClient.db();

    const collections = await localDb.listCollections().toArray();
    console.log(`Found ${collections.length} collections to migrate`);

    for (const colInfo of collections) {
      const colName = colInfo.name;
      console.log(`\nMigrating collection: ${colName}...`);

      const localCollection = localDb.collection(colName);
      const atlasCollection = atlasDb.collection(colName);

      const count = await localCollection.countDocuments();
      console.log(`  Found ${count} documents`);

      if (count === 0) continue;

      const docs = await localCollection.find().toArray();

      if (docs.length > 0) {
        await atlasCollection.insertMany(docs);
        console.log(`  ✓ Migrated ${docs.length} documents`);
      }
    }

    console.log('\n✓ Migration complete!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await localClient.close();
    await atlasClient.close();
  }
}

migrateCollections();