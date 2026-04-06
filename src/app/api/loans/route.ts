import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/server/utils/db';
import { Loan } from '../../../lib/server/models/Loan';
import { Member } from '../../../lib/server/models/Member';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const member = searchParams.get('member');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

    const query: Record<string, unknown> = {};
    if (member) {
      query.member = member;
    }
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    
    const loans = await Loan.find(query)
      .populate('member', 'fullName memberId')
      .populate('guarantor1', 'fullName memberId')
      .populate('guarantor2', 'fullName memberId')
      .populate('appliedBy', 'email')
      .populate('approvedBy', 'email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Loan.countDocuments(query);

    return NextResponse.json({
      loans,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get loans error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loans', loans: [] },
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
      principalAmount,
      interestRate,
      repaymentPeriod,
      startDate,
      guarantor1,
      guarantor2,
      appliedBy,
    } = body;

    if (!member || !principalAmount || !repaymentPeriod) {
      return NextResponse.json(
        { error: 'Member, principal amount, and repayment period are required' },
        { status: 400 }
      );
    }

    const rate = (interestRate || 10) / 100;
    const totalInterest = Math.round(principalAmount * rate * repaymentPeriod);
    const totalRepayable = principalAmount + totalInterest;
    const installmentAmount = Math.round(totalRepayable / repaymentPeriod);

    let memberId = member;
    if (!mongoose.Types.ObjectId.isValid(member) || member.length !== 24) {
      const foundMember = await Member.findOne({ memberId: member });
      if (!foundMember) {
        return NextResponse.json({ error: 'Member not found' }, { status: 400 });
      }
      memberId = foundMember._id;
    }

    const loan = new Loan({
      member: memberId,
      principalAmount,
      interestRate: interestRate || 10,
      repaymentPeriod,
      startDate: startDate ? new Date(startDate) : new Date(),
      status: 'Pending',
      guarantor1: guarantor1 || undefined,
      guarantor2: guarantor2 || undefined,
      installmentAmount,
      totalInterest,
      totalRepayable,
      outstandingBalance: totalRepayable,
      appliedBy,
    });

    await loan.save();

    const populated = await Loan.findById(loan._id)
      .populate('member', 'fullName memberId')
      .populate('guarantor1', 'fullName memberId')
      .populate('guarantor2', 'fullName memberId')
      .lean();

    return NextResponse.json({ loan: populated }, { status: 201 });
  } catch (error) {
    console.error('Create loan error:', error);
    return NextResponse.json(
      { error: 'Failed to create loan' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { id, action, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Loan ID is required' },
        { status: 400 }
      );
    }

    const loan = await Loan.findById(id);
    if (!loan) {
      return NextResponse.json(
        { error: 'Loan not found' },
        { status: 404 }
      );
    }

    if (action === 'approve') {
      loan.status = 'Approved';
      loan.approvedBy = updates.approvedBy;
    } else if (action === 'reject') {
      loan.status = 'Rejected';
      loan.rejectedBy = updates.rejectedBy;
    } else if (action === 'disburse') {
      loan.status = 'Disbursed';
      loan.disbursedBy = updates.disbursedBy;
    } else if (action === 'markPaid') {
      loan.status = 'Paid';
      loan.outstandingBalance = 0;
    }

    await loan.save();

    const populated = await Loan.findById(id)
      .populate('member', 'fullName memberId')
      .populate('guarantor1', 'fullName memberId')
      .populate('guarantor2', 'fullName memberId')
      .lean();

    return NextResponse.json({ loan: populated });
  } catch (error) {
    console.error('Update loan error:', error);
    return NextResponse.json(
      { error: 'Failed to update loan' },
      { status: 500 }
    );
  }
}
