import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/server/utils/db';
import { Savings } from '../../../lib/server/models/Savings';
import { Member } from '../../../lib/server/models/Member';
import mongoose from 'mongoose';

interface SavingsDoc {
  _id?: { toString(): string };
  savingsBalance?: number;
  totalShares?: number;
  isGroup?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const member = searchParams.get('member');
    const includeGroup = searchParams.get('includeGroup') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

    const query: Record<string, unknown> = {};
    if (member) {
      query.member = member;
    }
    if (!includeGroup) {
      query.isGroup = { $ne: true };
    }

    const skip = (page - 1) * limit;
    
    const savings = await Savings.find(query)
      .populate('member', 'fullName memberId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Savings.countDocuments(query);
    
    const groupSavings = await Savings.findOne({ isGroup: true }).lean() as SavingsDoc | null;

    return NextResponse.json({
      savings,
      groupSavings: groupSavings ? {
        _id: groupSavings._id?.toString(),
        savingsBalance: groupSavings.savingsBalance,
        totalShares: groupSavings.totalShares,
        isGroup: true,
      } : null,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get savings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch savings', savings: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { member: memberInput, amount, type, notes, recordedBy } = body;
    
    let memberId = memberInput;
    if (!mongoose.Types.ObjectId.isValid(memberInput) || memberInput.length !== 24) {
      const foundMember = await Member.findOne({ memberId: memberInput });
      if (!foundMember) {
        return NextResponse.json({ error: 'Member not found' }, { status: 400 });
      }
      memberId = foundMember._id.toString();
    }

    const existingSavings = await Savings.findOne({ member: memberId });
    
    if (type === 'deposit' || !type) {
      if (existingSavings) {
        existingSavings.savingsBalance += amount;
        if (amount >= existingSavings.shareValue) {
          const newShares = Math.floor(amount / existingSavings.shareValue);
          existingSavings.totalShares += newShares;
        }
        await existingSavings.save();
      } else {
        const newSavings = new Savings({
          member: memberId,
          savingsBalance: amount,
          totalShares: amount >= 1000 ? Math.floor(amount / 1000) : 0,
        });
        await newSavings.save();
      }
    } else if (type === 'withdrawal') {
      if (existingSavings && existingSavings.savingsBalance >= amount) {
        existingSavings.savingsBalance -= amount;
        await existingSavings.save();
      } else {
        return NextResponse.json(
          { error: 'Insufficient savings balance' },
          { status: 400 }
        );
      }
    }

    const updated = await Savings.findOne({ member: memberId })
      .populate('member', 'fullName memberId')
      .lean();

    return NextResponse.json({ savings: updated }, { status: 201 });
  } catch (error) {
    console.error('Create savings error:', error);
    return NextResponse.json(
      { error: 'Failed to process savings' },
      { status: 500 }
    );
  }
}
