import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/server/utils/db';
import { Meeting, Attendance, BiometricProfile, Settings, FinancialSettings } from '@/lib/server/models';
import crypto from 'crypto';
import mongoose from 'mongoose';

interface SettingsDoc {
  _id: { toString(): string };
  monthlyContribution?: number;
  [key: string]: unknown;
}

interface FinancialSettingsDoc {
  bonusPerAttendance?: number;
}

interface BiometricProfileDoc {
  _id: { toString(): string };
  memberId: string;
  biometricType: string;
  biometricTemplate: string;
  isActive: boolean;
  hashAlgorithm?: string;
  lastUsed?: Date;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  try {
    const { meetingId } = await params;
    await dbConnect();

    let meeting = null;
    const isValidId = mongoose.isValidObjectId(meetingId);

    if (isValidId) {
      meeting = await Meeting.findById(meetingId).lean();
      if (!meeting) {
        return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
      }
    } else {
      meeting = {
        _id: meetingId,
        title: 'Meeting (Demo)',
        date: new Date(),
        time: '10:00 AM',
        location: 'TBD',
      };
    }

    let attendance: any[] = [];
    if (isValidId) {
      const meetingIdObj = new mongoose.Types.ObjectId(meetingId);
      attendance = await Attendance.find({ meetingId: meetingIdObj }).populate('memberId', 'fullName photoUrl').lean();
    }

    const formattedAttendance = attendance.map((a: any) => ({
      _id: a._id?.toString(),
      memberId: a.memberId?._id?.toString() || a.memberId?.toString(),
      name: a.memberId?.fullName || 'Unknown',
      photoUrl: a.memberId?.photoUrl || null,
      status: a.status,
      bonusAllocated: a.bonusAllocated,
      bonusAmount: a.bonusAmount,
      bonusPaid: a.bonusPaid === true,
      bonusPaidAt: a.bonusPaidAt?.toISOString(),
      timestamp: a.verifiedAt?.toISOString() || a.createdAt?.toISOString(),
      checkInMethod: a.checkInMethod,
    }));

    return NextResponse.json({
      meeting,
      attendance: formattedAttendance,
    });
  } catch (error) {
    console.error('Error fetching meeting attendance:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  try {
    const { meetingId } = await params;
    await dbConnect();

    const body = await request.json();
    const { memberId, biometricType, biometricData, deviceId } = body;

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    if (!mongoose.isValidObjectId(meetingId) || !mongoose.isValidObjectId(memberId)) {
      return NextResponse.json({ error: 'Invalid meeting or member ID format' }, { status: 400 });
    }

    let status: 'verified' | 'failed' | 'manual' = 'failed';
    let bonusAmount = 0;
    let failureReason: string | undefined;

    if (biometricData && biometricType) {
      const biometricProfile = await BiometricProfile.findOne({
        memberId,
        biometricType,
        isActive: true,
      }) as BiometricProfileDoc | null;

      if (!biometricProfile) {
        failureReason = 'No biometric profile enrolled';
      } else {
        const inputHash = crypto
          .createHash('sha256')
          .update(biometricData)
          .digest('hex');

        if (inputHash === biometricProfile.biometricTemplate) {
          status = 'verified';
          
          await BiometricProfile.findByIdAndUpdate(biometricProfile._id, {
            lastUsed: new Date(),
          });

          const settings = await Settings.findOne().lean() as SettingsDoc | null;
          const financialSettings = await FinancialSettings.findOne().lean() as FinancialSettingsDoc | null;
          bonusAmount = financialSettings?.bonusPerAttendance || settings?.monthlyContribution || 1000;
        } else {
          failureReason = 'Biometric verification failed';
        }
      }
    } else {
      status = 'manual';
      const settings = await Settings.findOne().lean() as SettingsDoc | null;
      const financialSettings = await FinancialSettings.findOne().lean() as FinancialSettingsDoc | null;
      bonusAmount = financialSettings?.bonusPerAttendance || settings?.monthlyContribution || 1000;
    }

    const meetingIdObj = new mongoose.Types.ObjectId(meetingId);
    const memberIdObj = new mongoose.Types.ObjectId(memberId);
    
    let attendance = await Attendance.findOne({ meetingId: meetingIdObj, memberId: memberIdObj });

    if (attendance) {
      if (attendance.bonusAllocated && (status === 'verified' || status === 'manual')) {
        return NextResponse.json({ 
          error: 'Member has already checked in',
          alreadyCheckedIn: true,
          attendance: {
            memberId: attendance.memberId?.toString(),
            status: attendance.status,
            bonusAllocated: attendance.bonusAllocated,
            bonusAmount: attendance.bonusAmount,
            verifiedAt: attendance.verifiedAt?.toISOString(),
          },
        }, { status: 409 });
      }
      
      attendance.status = status;
      attendance.verificationAttempts += 1;
      attendance.lastAttemptAt = new Date();
      attendance.failureReason = failureReason;

      if ((status === 'verified' || status === 'manual') && !attendance.bonusAllocated) {
        attendance.verifiedAt = new Date();
        attendance.processedAt = new Date();
        attendance.bonusAllocated = true;
        attendance.bonusAmount = bonusAmount;
        attendance.biometricType = biometricType || null;
        attendance.deviceId = deviceId || null;
        attendance.checkInMethod = biometricData ? 'biometric' : 'manual';
      }

      await attendance.save();
    } else {
      const attendanceData: any = {
        meetingId: meetingIdObj,
        memberId: memberIdObj,
        status: status,
        verificationAttempts: 1,
        lastAttemptAt: new Date(),
        failureReason,
      };
      if (status === 'verified' || status === 'manual') {
        attendanceData.verifiedAt = new Date();
        attendanceData.processedAt = new Date();
        attendanceData.bonusAllocated = true;
        attendanceData.bonusAmount = bonusAmount;
        attendanceData.biometricType = biometricType || null;
        attendanceData.deviceId = deviceId || null;
        attendanceData.checkInMethod = biometricData ? 'biometric' : 'manual';
      }
      attendance = await Attendance.create(attendanceData);
    }

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('memberId', 'fullName photoUrl')
      .lean() as any;

    return NextResponse.json({
      verified: status === 'verified' || status === 'manual',
      bonusAmount: (status === 'verified' || status === 'manual') ? bonusAmount : 0,
      attendance: {
        _id: populatedAttendance?._id?.toString(),
        memberId: populatedAttendance?.memberId?._id?.toString() || memberId,
        name: populatedAttendance?.memberId?.fullName || 'Unknown',
        photoUrl: populatedAttendance?.memberId?.photoUrl || null,
        status: populatedAttendance?.status,
        bonusAllocated: populatedAttendance?.bonusAllocated,
        bonusAmount: populatedAttendance?.bonusAmount,
        bonusPaid: populatedAttendance?.bonusPaid || false,
        timestamp: populatedAttendance?.verifiedAt?.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error verifying attendance:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}