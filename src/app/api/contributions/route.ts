import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/server/utils/db';
import { Contribution } from '../../../lib/server/models/Contribution';
import { Savings } from '../../../lib/server/models/Savings';
import { Member } from '../../../lib/server/models/Member';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const member = searchParams.get('member');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

    const query: Record<string, unknown> = {};
    if (member) {
      query.member = member;
    }

    const skip = (page - 1) * limit;
    
    const contributions = await Contribution.find(query)
      .populate('member', 'fullName memberId')
      .populate('recordedBy', 'email')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Contribution.countDocuments(query);

    return NextResponse.json({
      contributions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get contributions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contributions', contributions: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const {
      member,
      amount,
      date,
      paymentMethod,
      contributionType,
      isRecurring,
      notes,
      recordedBy,
    } = body;

    if (!member || !amount) {
      return NextResponse.json(
        { error: 'Member and amount are required' },
        { status: 400 }
      );
    }

    let memberId = member;
    if (!mongoose.Types.ObjectId.isValid(member) || member.length !== 24) {
      const foundMember = await Member.findOne({ memberId: member });
      if (!foundMember) {
        return NextResponse.json({ error: 'Member not found' }, { status: 400 });
      }
      memberId = foundMember._id;
    }

    const contribution = new Contribution({
      member: memberId,
      amount,
      date: date ? new Date(date) : new Date(),
      paymentMethod: paymentMethod || 'Cash',
      contributionType: contributionType || 'Monthly',
      isRecurring: isRecurring || false,
      notes,
      recordedBy,
    });

    await contribution.save();

    await Savings.findOneAndUpdate(
      { member: memberId },
      { $inc: { savingsBalance: amount } },
      { upsert: true }
    );

    const populated = await Contribution.findById(contribution._id)
      .populate('member', 'fullName memberId')
      .lean();

    return NextResponse.json({ contribution: populated }, { status: 201 });
  } catch (error) {
    console.error('Create contribution error:', error);
    return NextResponse.json(
      { error: 'Failed to create contribution' },
      { status: 500 }
    );
  }
}
