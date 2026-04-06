import mongoose from 'mongoose';
import dbConnect from '../src/lib/server/utils/db';
import { Member, Loan } from '../src/lib/server/models';

async function migrateLoans() {
  try {
    await dbConnect();
    console.log('Connected to database');

    const members = await Member.find({ status: 'active' }).limit(5).lean();
    
    if (members.length === 0) {
      console.log('No active members found. Please run seed script first.');
      process.exit(1);
    }

    console.log(`Found ${members.length} active members`);

    const loansData = [
      {
        member: members[0]._id,
        principalAmount: 50000,
        interestRate: 12,
        startDate: new Date('2026-01-15'),
        dueDate: new Date('2027-01-15'),
        status: 'Active',
        outstandingBalance: 45000,
        monthlyPayment: 4500,
        termMonths: 12,
        purpose: 'Business expansion',
      },
      {
        member: members[1]._id,
        principalAmount: 75000,
        interestRate: 15,
        startDate: new Date('2025-06-01'),
        dueDate: new Date('2026-06-01'),
        status: 'Outstanding',
        outstandingBalance: 68000,
        monthlyPayment: 6800,
        termMonths: 12,
        purpose: 'Medical expenses',
      },
      {
        member: members[2]?._id || members[0]._id,
        principalAmount: 100000,
        interestRate: 10,
        startDate: new Date('2026-04-01'),
        dueDate: new Date('2027-04-01'),
        status: 'Approved',
        outstandingBalance: 0,
        monthlyPayment: 9000,
        termMonths: 12,
        purpose: 'Education fees',
      },
      {
        member: members[3]?._id || members[0]._id,
        principalAmount: 25000,
        interestRate: 12.5,
        startDate: new Date('2026-03-01'),
        dueDate: new Date('2027-03-01'),
        status: 'Disbursed',
        outstandingBalance: 25000,
        monthlyPayment: 2250,
        termMonths: 12,
        purpose: 'Agricultural equipment',
      },
    ];

    for (const loanData of loansData) {
      try {
        const loan = await Loan.create(loanData);
        console.log(`Created loan: ${loan._id} - ${loan.status}`);
      } catch (error: any) {
        if (error.code === 11000) {
          console.log('Loan already exists, skipping...');
        } else {
          console.error('Error creating loan:', error.message);
        }
      }
    }

    console.log('Migration completed successfully!');
    
    const loanStats = await Loan.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    console.log('Loan status distribution:', loanStats);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

migrateLoans();
