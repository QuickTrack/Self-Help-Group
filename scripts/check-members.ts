import { connectToDatabase, closeDatabaseConnection } from '../src/lib/mongodb';

async function checkMembers() {
  try {
    const { db } = await connectToDatabase();
    const members = await db.collection('members').find({}).toArray();
    console.log('Members in database:', members.length);
    if (members.length > 0) {
      console.log('First 3 members:');
      members.slice(0, 3).forEach((m: any) => console.log(`  - ${m.memberId}: ${m.fullName}`));
    }
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await closeDatabaseConnection();
  }
}

checkMembers();