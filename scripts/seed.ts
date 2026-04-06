import { connectToDatabase, closeDatabaseConnection } from '../src/lib/mongodb';
import { ObjectId } from 'mongodb';

async function seedDatabase() {
  console.log('===========================================');
  console.log('  GITHIRIONI SHG - DATABASE SEED SCRIPT');
  console.log('===========================================\n');

  try {
    console.log('Connecting to MongoDB...');
    const { db } = await connectToDatabase();
    
    console.log('Clearing existing data...');
    await db.collection('members').deleteMany({});
    await db.collection('users').deleteMany({});
    await db.collection('contributions').deleteMany({});
    await db.collection('loans').deleteMany({});
    await db.collection('loanRepayments').deleteMany({});
    await db.collection('savings').deleteMany({});
    await db.collection('meetings').deleteMany({});
    await db.collection('announcements').deleteMany({});
    await db.collection('settings').deleteMany({});
    console.log('  ✓ Cleared all collections\n');

    console.log('[1/10] Seeding Members...');
    const memberIds: string[] = [];
    for (const doc of [
      { memberId: 'GSH-0001', fullName: 'John Kamau', idNumber: '12345678', phoneNumber: '+254712345678', email: 'jkamau@email.com', location: 'Githirioni', joinDate: new Date('2022-01-15'), nextOfKinName: 'Mary Kamau', nextOfKinPhone: '+254732345678', status: 'active', savingsBalance: 15000, totalShares: 5, outstandingLoans: 1 },
      { memberId: 'GSH-0002', fullName: 'Grace Wanjiku', idNumber: '23456789', phoneNumber: '+254723456789', email: 'gwanjiku@email.com', location: 'Lari', joinDate: new Date('2022-03-20'), nextOfKinName: 'Peter Wanjiku', nextOfKinPhone: '+254733456789', status: 'active', savingsBalance: 8000, totalShares: 3, outstandingLoans: 1 },
      { memberId: 'GSH-0003', fullName: 'David Maina', idNumber: '34567890', phoneNumber: '+254734567890', location: 'Kiambu', joinDate: new Date('2022-06-10'), nextOfKinName: 'Sarah Maina', nextOfKinPhone: '+254744567890', status: 'active', savingsBalance: 5000, totalShares: 2, outstandingLoans: 0 },
      { memberId: 'GSH-0004', fullName: 'Faith Nyambura', idNumber: '45678901', phoneNumber: '+254745678901', email: 'fnyambura@email.com', location: 'Githirioni', joinDate: new Date('2023-01-05'), nextOfKinName: 'James Nyambura', nextOfKinPhone: '+254755678901', status: 'active', savingsBalance: 12000, totalShares: 4, outstandingLoans: 0 },
      { memberId: 'GSH-0005', fullName: 'Joseph Mwangi', idNumber: '56789012', phoneNumber: '+254756789012', location: 'Lari', joinDate: new Date('2023-04-18'), nextOfKinName: 'Anne Mwangi', nextOfKinPhone: '+254766789012', status: 'inactive', savingsBalance: 0, totalShares: 0, outstandingLoans: 0 },
    ]) {
      const result = await db.collection('members').insertOne(doc);
      memberIds.push((result.insertedId as ObjectId).toString());
    }
    console.log(`  ✓ Inserted 5 members`);

    console.log('[2/10] Seeding Users...');
    const userIds: string[] = [];
    const hashedPassword = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqP3JzC3IO';
    for (const doc of [
      { email: 'admin@githirioni.org', password: hashedPassword, role: 'admin', isActive: true },
      { email: 'treasurer@githirioni.org', password: hashedPassword, role: 'treasurer', isActive: true },
      { email: 'secretary@githirioni.org', password: hashedPassword, role: 'secretary', isActive: true },
    ]) {
      const result = await db.collection('users').insertOne(doc);
      userIds.push((result.insertedId as ObjectId).toString());
    }
    console.log(`  ✓ Inserted 3 users`);

    console.log('[3/10] Seeding Contributions...');
    for (const doc of [
      { member: memberIds[0], amount: 1000, date: new Date('2024-01-01'), paymentMethod: 'M-Pesa', contributionType: 'Monthly', isRecurring: true, recordedBy: userIds[0] },
      { member: memberIds[0], amount: 1000, date: new Date('2024-02-01'), paymentMethod: 'M-Pesa', contributionType: 'Monthly', isRecurring: true, recordedBy: userIds[0] },
      { member: memberIds[1], amount: 1000, date: new Date('2024-01-01'), paymentMethod: 'Bank', contributionType: 'Monthly', isRecurring: true, recordedBy: userIds[0] },
      { member: memberIds[2], amount: 250, date: new Date('2024-01-08'), paymentMethod: 'Cash', contributionType: 'Weekly', isRecurring: true, recordedBy: userIds[1] },
      { member: memberIds[2], amount: 250, date: new Date('2024-01-15'), paymentMethod: 'Cash', contributionType: 'Weekly', isRecurring: true, recordedBy: userIds[1] },
      { member: memberIds[3], amount: 5000, date: new Date('2024-01-20'), paymentMethod: 'Bank', contributionType: 'Special', isRecurring: false, recordedBy: userIds[1] },
    ]) {
      await db.collection('contributions').insertOne(doc);
    }
    console.log(`  ✓ Inserted 6 contributions`);

    console.log('[4/10] Seeding Loans...');
    const loanIds: string[] = [];
    for (const doc of [
      { member: memberIds[0], principalAmount: 50000, interestRate: 10, repaymentPeriod: 6, startDate: new Date('2024-01-15'), status: 'Disbursed', totalInterest: 30000, totalRepayable: 80000, installmentAmount: 9167, outstandingBalance: 65000, amountPaid: 15000, guarantor1: memberIds[1], guarantor2: memberIds[2], appliedBy: userIds[0], approvedBy: userIds[0], disbursedBy: userIds[0], disbursedAt: new Date('2024-01-16') },
      { member: memberIds[1], principalAmount: 30000, interestRate: 10, repaymentPeriod: 4, startDate: new Date('2024-02-01'), status: 'Disbursed', totalInterest: 12000, totalRepayable: 42000, installmentAmount: 8250, outstandingBalance: 30000, amountPaid: 12000, guarantor1: memberIds[0], appliedBy: userIds[1], approvedBy: userIds[1], disbursedBy: userIds[1], disbursedAt: new Date('2024-02-02') },
    ]) {
      const result = await db.collection('loans').insertOne(doc);
      loanIds.push((result.insertedId as ObjectId).toString());
    }
    console.log(`  ✓ Inserted 2 loans`);

    console.log('[5/10] Seeding LoanRepayments...');
    for (const doc of [
      { loan: loanIds[0], member: memberIds[0], amount: 9167, date: new Date('2024-02-15'), paymentMethod: 'M-Pesa', recordedBy: userIds[0] },
      { loan: loanIds[0], member: memberIds[0], amount: 5833, date: new Date('2024-03-15'), paymentMethod: 'M-Pesa', recordedBy: userIds[0] },
      { loan: loanIds[1], member: memberIds[1], amount: 8250, date: new Date('2024-03-01'), paymentMethod: 'Bank', recordedBy: userIds[1] },
      { loan: loanIds[1], member: memberIds[1], amount: 3750, date: new Date('2024-04-01'), paymentMethod: 'Bank', recordedBy: userIds[1] },
    ]) {
      await db.collection('loanRepayments').insertOne(doc);
    }
    console.log(`  ✓ Inserted 4 loan repayments`);

    console.log('[6/10] Seeding Savings...');
    for (const doc of [
      { member: memberIds[0], savingsBalance: 15000, totalShares: 5, shareValue: 1000 },
      { member: memberIds[1], savingsBalance: 8000, totalShares: 3, shareValue: 1000 },
      { member: memberIds[2], savingsBalance: 5000, totalShares: 2, shareValue: 1000 },
      { member: memberIds[3], savingsBalance: 12000, totalShares: 4, shareValue: 1000 },
    ]) {
      await db.collection('savings').insertOne(doc);
    }
    await db.collection('savings').insertOne({
      member: null,
      savingsBalance: 100000,
      totalShares: 0,
      shareValue: 1000,
      isGroup: true,
    });
    console.log(`  ✓ Inserted 5 savings records (4 members + 1 group)`);

    console.log('[7/10] Seeding Meetings...');
    for (const doc of [
      { title: 'Monthly General Meeting - January 2024', date: new Date('2024-01-20'), time: '10:00 AM', location: 'Githirioni Community Hall', agenda: 'Review monthly contributions, loan approvals', attendees: [memberIds[0]], createdBy: userIds[2] },
      { title: 'Monthly General Meeting - February 2024', date: new Date('2024-02-17'), time: '10:00 AM', location: 'Githirioni Community Hall', agenda: 'Review financial statements', attendees: [memberIds[0], memberIds[1]], createdBy: userIds[2] },
      { title: 'Annual General Meeting 2024', date: new Date('2024-03-15'), time: '09:00 AM', location: 'Githirioni Community Hall', agenda: 'Annual reports, elections', minutes: 'Meeting held. All members present.', attendees: memberIds.slice(0, 4), createdBy: userIds[0] },
    ]) {
      await db.collection('meetings').insertOne(doc);
    }
    console.log(`  ✓ Inserted 3 meetings`);

    console.log('[8/10] Seeding Announcements...');
    for (const doc of [
      { title: 'Monthly Contribution Reminder', message: 'Monthly contributions are due by the 5th.', priority: 'normal', sentVia: ['sms'], createdBy: userIds[1] },
      { title: 'Loan Application Deadline', message: 'Loan applications for Feb must be submitted by 28th.', priority: 'high', sentVia: ['sms', 'email'], createdBy: userIds[0] },
      { title: 'Annual General Meeting Notice', message: 'AGM will be held on 15th March 2024.', priority: 'high', sentVia: ['sms', 'email'], createdBy: userIds[0] },
    ]) {
      await db.collection('announcements').insertOne(doc);
    }
    console.log(`  ✓ Inserted 3 announcements`);

    console.log('[9/10] Seeding Settings...');
    await db.collection('settings').insertOne({ groupName: 'Githirioni Self Help Group', logo: '', defaultInterestRate: 10, shareValue: 1000, monthlyContribution: 1000, weeklyContribution: 250 });
    console.log(`  ✓ Inserted settings`);

    console.log('[10/10] Creating indexes...');
    await db.collection('members').createIndex({ memberId: 1 }, { unique: true });
    await db.collection('members').createIndex({ idNumber: 1 }, { unique: true });
    await db.collection('members').createIndex({ email: 1 }, { sparse: true, unique: true });
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('loans').createIndex({ member: 1, status: 1 });
    await db.collection('contributions').createIndex({ member: 1, date: -1 });
    await db.collection('loanRepayments').createIndex({ loan: 1, date: -1 });
    await db.collection('savings').createIndex({ member: 1 }, { unique: true });
    console.log(`  ✓ Created indexes`);

    console.log('\n===========================================');
    console.log('  ✓ DATABASE SEED COMPLETE');
    console.log('===========================================');
    console.log('\nSeeded: Members(5), Users(3), Contributions(6), Loans(2), LoanRepayments(4), Savings(4), Meetings(3), Announcements(3), Settings(1)');
    console.log('\nDefault credentials:');
    console.log('  admin@githirioni.org / admin123');
    console.log('  treasurer@githirioni.org / admin123');
    console.log('  secretary@githirioni.org / admin123');
    
  } catch (error) {
    console.error('\n✗ Seed failed:', error);
    process.exit(1);
  } finally {
    await closeDatabaseConnection();
  }
}

seedDatabase();