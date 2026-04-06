const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://Boniface:nb9ms2AYs7mBH.N@ac-vqlqxji-shard-00-00.szukiim.mongodb.net:27017/githirioni-shg?authSource=admin&tls=true';

async function check() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('githirioni-shg');
  const users = await db.collection('users').find({}).toArray();
  console.log('Users in database:');
  console.log(JSON.stringify(users, null, 2));
  await client.close();
}

check();