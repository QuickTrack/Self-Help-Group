import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/server/utils/db';
import { Attendance, Meeting } from '@/lib/server/models';
import mongoose, { Document } from 'mongoose';
import { WelfarePayout } from '@/lib/server/models/WelfarePayout';

interface PayoutDoc extends Document {
  memberId: mongoose.Types.ObjectId;
  requestedAmount: number;
  approvedAmount: number;
  status: string;
  eventType: string;
  meetingId: mongoose.Types.ObjectId;
  paidAt: Date;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  try {
    const { meetingId } = await params;
    await dbConnect();

    if (!mongoose.isValidObjectId(meetingId)) {
      return NextResponse.json({ error: 'Invalid meeting ID' }, { status: 400 });
    }

    const body = await request.json();
    const { memberId, bonusAmount } = body;

    if (!memberId || !bonusAmount) {
      return NextResponse.json({ error: 'Member ID and bonus amount are required' }, { status: 400 });
    }

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    const attendance = await Attendance.findOne({ meetingId, memberId });
    if (!attendance) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 });
    }

    if (attendance.bonusAllocated) {
      return NextResponse.json({ error: 'Bonus already allocated for this member' }, { status: 400 });
    }

    const session = await mongoose.startSession();
    
    let payout: any = null;
    try {
      await session.withTransaction(async () => {
        payout = await WelfarePayout.create({
          memberId,
          requestedAmount: bonusAmount,
          approvedAmount: bonusAmount,
          status: 'Paid',
          eventType: 'Meeting Attendance Bonus',
          meetingId,
          paidAt: new Date(),
        }, { session });

        attendance.bonusAllocated = true;
        attendance.bonusAmount = bonusAmount;
        attendance.bonusId = payout._id;
        attendance.processedAt = new Date();
        await attendance.save({ session });
      });
    } finally {
      session.endSession();
    }

    const payoutId = payout?._id?.toString() ?? null;

    return NextResponse.json({
      bonusId: payoutId,
      status: 'issued',
      amount: bonusAmount,
    });
  } catch (error) {
    console.error('Error issuing bonus:', error);
    return NextResponse.json({ error: 'Failed to issue bonus' }, { status: 500 });
  }
}