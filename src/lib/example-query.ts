import { ObjectId } from 'mongodb';
import { connectToDatabase, getCollection, closeDatabaseConnection } from './mongodb';

interface MemberDocument {
  _id?: ObjectId;
  memberId: string;
  fullName: string;
  idNumber: string;
  phoneNumber: string;
  email?: string;
  location: string;
  joinDate: Date;
  nextOfKinName: string;
  nextOfKinPhone: string;
  status: string;
  savingsBalance: number;
  totalShares: number;
}

async function demonstrateConnection() {
  console.log('Starting MongoDB connection demonstration...\n');

  try {
    await connectToDatabase();
    
    const members = getCollection<MemberDocument>('members');
    
    const count = await members.countDocuments();
    console.log(`Total members in database: ${count}`);
    
    if (count > 0) {
      const latestMember = await members
        .find({})
        .sort({ joinDate: -1 })
        .limit(1)
        .toArray();
      
      console.log('\nLatest member:');
      console.log(JSON.stringify(latestMember[0], null, 2));
    } else {
      console.log('\nNo members found. Inserting sample document...');
      
      const sampleMember = {
        memberId: 'SHG-001',
        fullName: 'John Kamau',
        idNumber: '12345678',
        phoneNumber: '+254712345678',
        email: 'john@example.com',
        location: 'Githirioni',
        joinDate: new Date(),
        nextOfKinName: 'Mary Kamau',
        nextOfKinPhone: '+254798765432',
        status: 'active',
        savingsBalance: 10000,
        totalShares: 10,
      };
      
      const result = await members.insertOne(sampleMember as MemberDocument);
      console.log(`Inserted member with ID: ${result.insertedId}`);
      
      const inserted = await members.findOne({ memberId: 'SHG-001' });
      console.log('\nInserted document:');
      console.log(JSON.stringify(inserted, null, 2));
    }
    
    console.log('\n✓ Connection test successful!');
    
  } catch (error) {
    console.error('Error during demonstration:', error);
    process.exit(1);
  } finally {
    await closeDatabaseConnection();
  }
}

demonstrateConnection();