import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/server/utils/db';
import { Attendance, Savings } from '@/lib/server/models';
import mongoose from 'mongoose';

export async function PATCH(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { attendanceId, memberId, bonusAmount } = body;
    console.log('API received:', { attendanceId, memberId, bonusAmount, attendanceIdType: typeof attendanceId });
    
    if (!mongoose.isValidObjectId(attendanceId)) {
      console.log('Invalid attendanceId:', attendanceId);
      return NextResponse.json({ error: 'Invalid attendance ID' }, { status: 400 });
    }
    
    if (!attendanceId || !memberId || !bonusAmount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    if (!mongoose.isValidObjectId(attendanceId)) {
      return NextResponse.json({ error: 'Invalid attendance ID' }, { status: 400 });
    }
    
    const attendance = await Attendance.findById(attendanceId);
    console.log('Attendance found:', attendance?._id, 'bonusPaid:', attendance?.bonusPaid, 'bonusAllocated:', attendance?.bonusAllocated);
    
    if (!attendance) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 });
    }
    
    if (attendance.bonusPaid) {
      return NextResponse.json({ error: 'Bonus has already been paid' }, { status: 400 });
    }
    
    if (!attendance.bonusAllocated || !attendance.bonusAmount || attendance.bonusAmount === 0) {
      return NextResponse.json({ error: 'No bonus allocated for this attendance' }, { status: 400 });
    }
    
    const allSavings = await Savings.find({ isGroup: { $ne: true } }).lean();
    const groupSavingsBalance = allSavings.reduce((sum: number, s: any) => sum + (s.savingsBalance || 0), 0);
    
    if (groupSavingsBalance < bonusAmount) {
      return NextResponse.json({ 
        error: 'Insufficient group savings to pay bonus',
        available: groupSavingsBalance,
        required: bonusAmount
      }, { status: 400 });
    }
    
    await Promise.all([
      ...allSavings.map((s: any) => 
        Savings.findByIdAndUpdate(s._id, { 
          savingsBalance: Math.max(0, s.savingsBalance - Math.floor(bonusAmount * (s.savingsBalance / groupSavingsBalance))) 
        })
      )
    ]);
    
    const updateResult = await Attendance.updateOne(
      { _id: new mongoose.Types.ObjectId(attendanceId) },
      { $set: { bonusPaid: true, bonusPaidAt: new Date() } }
    );
    console.log('Update result:', updateResult);
    
    const freshAttendance = await Attendance.findOne({ _id: new mongoose.Types.ObjectId(attendanceId) }).lean() as any;
    console.log('Fresh attendance from DB:', freshAttendance);
    
    return NextResponse.json({
      success: true,
      message: 'Bonus marked as paid',
      attendance: {
        _id: freshAttendance?._id?.toString(),
        bonusPaid: freshAttendance?.bonusPaid,
        bonusPaidAt: freshAttendance?.bonusPaidAt?.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error marking bonus as paid:', error);
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
  }
}