import { MongoClient } from 'mongodb';

const localUri = 'mongodb://localhost:27017/githirioni-shg';
const atlasUri = 'mongodb://Boniface:nb9ms2AYs7mBH.N@ac-vqlqxji-shard-00-00.szukiim.mongodb.net:27017/githirioni-shg?authSource=admin&tls=true';

async function migrate() {
  const localClient = new MongoClient(localUri);
  const atlasClient = new MongoClient(atlasUri);

  try {
    console.log('Connecting to local...');
    await localClient.connect();
    const localDb = localClient.db();

    console.log('Connecting to Atlas...');
    await atlasClient.connect();
    const atlasDb = atlasClient.db();

    const collections = await localDb.listCollections().toArray();
    console.log(`Found ${collections.length} collections\n`);

    for (const colInfo of collections) {
      const colName = colInfo.name;
      const localCollection = localDb.collection(colName);
      const atlasCollection = atlasDb.collection(colName);

      const localCount = await localCollection.countDocuments();
      if (localCount === 0) {
        console.log(`${colName}: 0 docs - skipping`);
        continue;
      }

      // Clear existing data in Atlas for this collection
      await atlasCollection.deleteMany({});

      // Migrate all data
      const docs = await localCollection.find().toArray();
      if (docs.length > 0) {
        await atlasCollection.insertMany(docs);
        console.log(`${colName}: migrated ${docs.length} docs`);
      }
    }

    console.log('\n✓ Migration complete!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await localClient.close();
    await atlasClient.close();
  }
}

migrate();