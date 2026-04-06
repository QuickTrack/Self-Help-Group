import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/server/utils/db';
import { Attendance, Member, Meeting } from '@/lib/server/models';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const memberId = searchParams.get('memberId');
    const meetingId = searchParams.get('meetingId');
    const reportType = searchParams.get('type') || 'summary';
    
    const dateFilter: Record<string, Record<string, Date>> = {};
    if (startDate || endDate) {
      dateFilter.verifiedAt = {};
      if (startDate) {
        dateFilter.verifiedAt.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.verifiedAt.$lte = new Date(endDate);
      }
    }
    
    const memberFilter: Record<string, unknown> = {};
    if (memberId) {
      if (mongoose.isValidObjectId(memberId)) {
        memberFilter.memberId = new mongoose.Types.ObjectId(memberId);
      }
    }
    
    const meetingFilter: Record<string, unknown> = {};
    if (meetingId) {
      if (mongoose.isValidObjectId(meetingId)) {
        meetingFilter.meetingId = new mongoose.Types.ObjectId(meetingId);
      }
    }
    
    const baseFilter = { ...dateFilter, ...memberFilter, ...meetingFilter };
    
    const totalAttendance = await Attendance.countDocuments({
      ...baseFilter,
      status: { $in: ['verified', 'manual'] },
    });
    
    const totalMembers = await Member.countDocuments({ status: 'active' });
    
    const bonusStats = await Attendance.aggregate([
      { $match: { ...baseFilter, bonusAllocated: true } },
      {
        $group: {
          _id: null,
          totalBonus: { $sum: '$bonusAmount' },
          totalMembers: { $sum: 1 },
        },
      },
    ]);
    
    const meetingStats = await Attendance.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: '$meetingId',
          totalAttendees: { $sum: 1 },
          verifiedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] },
          },
          manualCount: {
            $sum: { $cond: [{ $eq: ['$status', 'manual'] }, 1, 0] },
          },
          totalBonus: { $sum: '$bonusAmount' },
        },
      },
      {
        $lookup: {
          from: 'meetings',
          localField: '_id',
          foreignField: '_id',
          as: 'meeting',
        },
      },
      { $unwind: '$meeting' },
      {
        $project: {
          _id: 1,
          meetingTitle: '$meeting.title',
          meetingDate: '$meeting.date',
          totalAttendees: 1,
          verifiedCount: 1,
          manualCount: 1,
          totalBonus: 1,
        },
      },
      { $sort: { meetingDate: -1 } },
    ]);
    
    const checkInMethodStats = await Attendance.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: '$checkInMethod',
          count: { $sum: 1 },
        },
      },
    ]);
    
    const dailyStats = await Attendance.aggregate([
      { 
        $match: { 
          ...baseFilter, 
          verifiedAt: { $exists: true } 
        } 
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$verifiedAt' },
          },
          count: { $sum: 1 },
          bonusTotal: { $sum: '$bonusAmount' },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 30 },
    ]);
    
    let memberAttendanceList: any[] = [];
    let allMeetings: any[] = [];
    
    if (memberId && mongoose.isValidObjectId(memberId)) {
      memberAttendanceList = await Attendance.find({ memberId: new mongoose.Types.ObjectId(memberId) })
        .populate('meetingId', 'title date time location')
        .sort({ verifiedAt: -1 })
        .lean();
    }
    
    if (reportType === 'detailed') {
      allMeetings = await Meeting.find()
        .select('title date time location')
        .sort({ date: -1 })
        .limit(50)
        .lean();
    }
    
    return NextResponse.json({
      summary: {
        totalAttendance,
        totalMembers,
        attendanceRate: totalMembers > 0 ? Math.round((totalAttendance / totalMembers) * 100) : 0,
        totalBonusPaid: bonusStats[0]?.totalBonus || 0,
        totalBonusRecipients: bonusStats[0]?.totalMembers || 0,
      },
      meetingStats,
      checkInMethodStats: checkInMethodStats.reduce((acc: any, curr: any) => {
        acc[curr._id || 'unknown'] = curr.count;
        return acc;
      }, {}),
      dailyStats,
      memberAttendance: memberAttendanceList.map((a: any) => ({
        _id: a._id,
        meetingTitle: a.meetingId?.title || 'Unknown',
        meetingDate: a.meetingId?.date?.toISOString(),
        status: a.status,
        bonusAllocated: a.bonusAllocated,
        bonusAmount: a.bonusAmount,
        checkInMethod: a.checkInMethod,
        verifiedAt: a.verifiedAt?.toISOString(),
      })),
      meetings: allMeetings,
    });
  } catch (error) {
    console.error('Attendance reports error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}