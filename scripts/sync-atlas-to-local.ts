import { MongoClient } from 'mongodb';

const localUri = 'mongodb://localhost:27017/githirioni-shg';
const atlasUri = process.env.MONGODB_ATLAS_URI || 'mongodb://Boniface:nb9ms2AYs7mBH.N@ac-vqlqxji-shard-00-00.szukiim.mongodb.net:27017/githirioni-shg?authSource=admin&tls=true';

async function syncAtlasToLocal() {
  const localClient = new MongoClient(localUri);
  const atlasClient = new MongoClient(atlasUri);

  try {
    console.log('Connecting to Atlas...');
    await atlasClient.connect();
    const atlasDb = atlasClient.db();

    console.log('Connecting to local...');
    await localClient.connect();
    const localDb = localClient.db();

    const collections = await atlasDb.listCollections().toArray();
    console.log(`Found ${collections.length} collections\n`);

    for (const colInfo of collections) {
      const colName = colInfo.name;
      const atlasCollection = atlasDb.collection(colName);
      const localCollection = localDb.collection(colName);

      const atlasCount = await atlasCollection.countDocuments();
      const localCount = await localCollection.countDocuments();

      console.log(`${colName}:`);
      console.log(`  Atlas: ${atlasCount}, Local: ${localCount}`);

      if (atlasCount === 0) {
        console.log('  → No Atlas data, skipping\n');
        continue;
      }

      // Clear and sync from Atlas to local
      await localCollection.deleteMany({});
      const docs = await atlasCollection.find().toArray();
      if (docs.length > 0) {
        await localCollection.insertMany(docs);
        console.log(`  → Synced ${docs.length} documents\n`);
      }
    }

    console.log('✓ Sync complete!');
  } catch (error) {
    console.error('Sync failed:', error);
  } finally {
    await localClient.close();
    await atlasClient.close();
  }
}

syncAtlasToLocal();