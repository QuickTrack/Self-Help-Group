import mongoose from 'mongoose';
import dbConnect from '../src/lib/server/utils/db';
import { Member, Savings } from '../src/lib/server/models';

async function seedSavings() {
  try {
    await dbConnect();
    console.log('Connected to database');

    const members = await Member.find({ status: 'active' }).lean();
    
    if (members.length === 0) {
      console.log('No active members found. Please run member seed first.');
      process.exit(1);
    }

    console.log(`Found ${members.length} active members`);

    const savingsData = [
      { member: members[0]._id, savingsBalance: 15000, totalShares: 5 },
      { member: members[1]._id, savingsBalance: 8000, totalShares: 3 },
      { member: members[2]?._id, savingsBalance: 5000, totalShares: 2 },
      { member: members[3]?._id, savingsBalance: 12000, totalShares: 4 },
      { member: members[4]?._id, savingsBalance: 2500, totalShares: 1 },
    ];

    for (const data of savingsData) {
      if (!data.member) continue;
      try {
        const existing = await Savings.findOne({ member: data.member });
        if (existing) {
          console.log(`Savings already exists for member ${data.member}, updating...`);
          existing.savingsBalance = data.savingsBalance;
          existing.totalShares = data.totalShares;
          await existing.save();
        } else {
          const savings = await Savings.create(data);
          console.log(`Created savings: ${savings._id}`);
        }
      } catch (error: any) {
        if (error.code === 11000) {
          console.log('Savings already exists, skipping...');
        } else {
          console.error('Error creating savings:', error.message);
        }
      }
    }

    const groupSavings = await Savings.findOne({ isGroup: true });
    if (!groupSavings) {
      await Savings.create({
        isGroup: true,
        savingsBalance: 50000,
        totalShares: 0,
        shareValue: 1000,
      });
      console.log('Created group savings account');
    } else {
      console.log('Group savings already exists');
    }

    console.log('Savings seed completed!');

    const allSavings = await Savings.find().populate('member', 'fullName memberId').lean();
    console.log('\nAll savings records:');
    allSavings.forEach(s => {
      console.log(`- ${s.isGroup ? 'Group Account' : s.member?.fullName}: KES ${s.savingsBalance}, ${s.totalShares} shares`);
    });

  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

seedSavings();
