import { NextResponse } from 'next/server';
import dbConnect from '@/lib/server/utils/db';
import { WelfareFund, WelfarePayout, Member } from '@/lib/server/models';
import mongoose from 'mongoose';

const EVENT_LIMITS: Record<string, number> = {
  Bereavement: 20000,
  Wedding: 15000,
  Celebration: 10000,
  Medical: 25000,
  Disaster: 30000,
};

export async function GET(request: Request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const payoutRequestId = searchParams.get('payoutRequestId');
    
    const query: Record<string, unknown> = {};
    
    if (memberId) {
      query.member = new mongoose.Types.ObjectId(memberId);
    }
    
    if (payoutRequestId) {
      query.payoutRequest = new mongoose.Types.ObjectId(payoutRequestId);
    }
    
    const contributions = await WelfareFund.find(query)
      .populate('member', 'memberId fullName')
      .populate('recordedBy', 'email')
      .populate('payoutRequest', 'eventType status')
      .sort({ date: -1 });
    
    const allContributions = await WelfareFund.find({});
    const total = allContributions.reduce((sum, c) => sum + c.amount, 0);
    
    return NextResponse.json({
      contributions,
      totalFundBalance: total,
      count: contributions.length,
    });
  } catch (error) {
    console.error('Error fetching welfare fund:', error);
    return NextResponse.json({ error: 'Failed to fetch welfare fund' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { member, amount, paymentMethod, notes, recordedBy, payoutRequestId } = body;
    
    if (!member) {
      return NextResponse.json({ error: 'Member is required' }, { status: 400 });
    }
    
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    // Check for duplicate recent contribution (within last 30 seconds)
    const recentDuplicate = await WelfareFund.findOne({
      member: member,
      amount: amount,
      createdAt: { $gte: new Date(Date.now() - 30 * 1000) }
    });
    
    if (recentDuplicate) {
      return NextResponse.json({ error: 'A similar contribution was recently submitted. Please wait before submitting another.' }, { status: 409 });
    }

    let memberId = member;
    if (!mongoose.Types.ObjectId.isValid(member) || member.length !== 24) {
      const foundMember = await Member.findOne({ memberId: member });
      if (!foundMember) {
        return NextResponse.json({ error: 'Member not found' }, { status: 400 });
      }
      memberId = foundMember._id.toString();
    }
    
    let appliedToPayout = false;
    let payoutRequest = null;
    let appliedAmount = 0;
    let remainingAmount = amount;
    let notifications: string[] = [];
    
    if (payoutRequestId) {
      const payout = await WelfarePayout.findById(payoutRequestId);
      
      if (!payout) {
        return NextResponse.json({ error: 'Payout request not found' }, { status: 404 });
      }
      
      if (payout.member.toString() !== memberId) {
        return NextResponse.json({ error: 'Payout request belongs to a different member' }, { status: 400 });
      }
      
      if (payout.status !== 'Pending' && payout.status !== 'Approved') {
        return NextResponse.json({ error: `Cannot apply contribution to payout with status: ${payout.status}` }, { status: 400 });
      }
      
      const totalContributions = await WelfareFund.aggregate([
        { $match: { member: new mongoose.Types.ObjectId(memberId) } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const memberTotalContributed = totalContributions[0]?.total || 0;
      
      const totalPayouts = await WelfarePayout.aggregate([
        { $match: { member: new mongoose.Types.ObjectId(memberId), status: { $in: ['Approved', 'Paid'] } } },
        { $group: { _id: null, total: { $sum: '$approvedAmount' } } }
      ]);
      const memberTotalPayouts = totalPayouts[0]?.total || 0;
      
      const availableBalance = memberTotalContributed - memberTotalPayouts;
      
      const maxPayoutLimit = {
        Bereavement: 20000,
        Wedding: 15000,
        Celebration: 10000,
        Medical: 25000,
        Disaster: 30000,
      }[payout.eventType as keyof typeof EVENT_LIMITS] || 10000;
      
      const amountNeeded = Math.min(maxPayoutLimit, payout.requestedAmount);
      const currentApproved = payout.approvedAmount || 0;
      const stillNeeded = amountNeeded - currentApproved;
      
      if (stillNeeded <= 0) {
        return NextResponse.json({ 
          error: 'Payout is already fully funded',
          warning: 'This payout request has already been fully funded'
        }, { status: 400 });
      }
      
      appliedAmount = Math.min(remainingAmount, stillNeeded);
      
      if (appliedAmount < stillNeeded && availableBalance < stillNeeded) {
        notifications.push(`Insufficient total contributions. Applied KES ${appliedAmount.toLocaleString()} towards KES ${stillNeeded.toLocaleString()} needed.`);
      } else if (appliedAmount < stillNeeded) {
        notifications.push(`Partial contribution applied. KES ${appliedAmount.toLocaleString()} of KES ${stillNeeded.toLocaleString()} needed.`);
      } else {
        notifications.push(`Contribution fully applied to payout request.`);
      }
      
      remainingAmount -= appliedAmount;
      appliedToPayout = true;
      payoutRequest = payoutRequestId;
      
      const newApprovedAmount = currentApproved + appliedAmount;
      payout.approvedAmount = newApprovedAmount;
      
      if (newApprovedAmount >= amountNeeded) {
        payout.status = 'Approved';
        notifications.push(`Payout request for ${payout.eventType} is now fully funded and approved!`);
      } else if (payout.status === 'Pending') {
        payout.status = 'Pending';
      }
      
      await payout.save();
    }
    
    const contribution = new WelfareFund({
      member: memberId,
      amount,
      paymentMethod: paymentMethod || 'Cash',
      notes,
      recordedBy,
      payoutRequest,
      appliedToPayout,
    });
    
    await contribution.save();
    
    const populated = await WelfareFund.findById(contribution._id)
      .populate('member', 'memberId fullName')
      .populate('recordedBy', 'email')
      .populate('payoutRequest', 'eventType status approvedAmount');
    
    return NextResponse.json({
      contribution: populated,
      appliedAmount,
      remainingAmount,
      notifications,
      message: appliedToPayout 
        ? `KES ${appliedAmount.toLocaleString()} applied to payout request` 
        : 'Contribution recorded successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating welfare contribution:', error);
    return NextResponse.json({ error: 'Failed to create contribution' }, { status: 500 });
  }
}