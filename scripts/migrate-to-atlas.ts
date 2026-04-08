import { MongoClient } from 'mongodb';

const localUri = 'mongodb://localhost:27017/githirioni-shg';
const atlasUri = process.env.MONGODB_ATLAS_URI || 'mongodb+srv://Boniface:nb9ms2AYs7mBH.N@cluster0.szukiim.mongodb.net/githirioni-shg?retryWrites=true&w=majority&tls=true';

async function migrateToAtlas() {
  const localClient = new MongoClient(localUri);
  const atlasClient = new MongoClient(atlasUri);

  try {
    console.log('Connecting to local MongoDB...');
    await localClient.connect();
    const localDb = localClient.db();

    console.log('Connecting to Atlas cluster...');
    await atlasClient.connect();
    const atlasDb = atlasClient.db();

    const collections = await localDb.listCollections().toArray();
    console.log(`Found ${collections.length} collections to migrate\n`);

    for (const colInfo of collections) {
      const colName = colInfo.name;
      const localCollection = localDb.collection(colName);
      const atlasCollection = atlasDb.collection(colName);

      const localCount = await localCollection.countDocuments();
      const atlasCount = await atlasCollection.countDocuments();

      console.log(`${colName}:`);
      console.log(`  Local: ${localCount}, Atlas: ${atlasCount}`);

      if (localCount === 0) {
        console.log('  → Skipping (no data)\n');
        continue;
      }

      if (atlasCount > 0) {
        console.log('  → Skipping (Atlas already has data)\n');
        continue;
      }

      const docs = await localCollection.find().toArray();
      if (docs.length > 0) {
        await atlasCollection.insertMany(docs);
        console.log(`  → Migrated ${docs.length} documents\n`);
      }
    }

    console.log('✓ Migration complete!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await localClient.close();
    await atlasClient.close();
  }
}

migrateToAtlas();