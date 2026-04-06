import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/server/utils/db';
import { BiometricProfile, Attendance, Meeting, Settings, FinancialSettings } from '@/lib/server/models';
import crypto from 'crypto';
import mongoose from 'mongoose';

interface BiometricVerificationBody {
  meetingId: string;
  memberId: string;
  biometricType: 'fingerprint' | 'face' | 'iris';
  biometricData: string;
  deviceId: string;
}

interface SettingsDoc {
  _id: { toString(): string };
  monthlyContribution?: number;
  [key: string]: unknown;
}

interface FinancialSettingsDoc {
  bonusPerAttendance?: number;
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body: BiometricVerificationBody = await request.json();
    const { meetingId, memberId, biometricType, biometricData, deviceId } = body;

    if (!meetingId || !memberId || !biometricType || !biometricData) {
      return NextResponse.json(
        { error: 'Missing required fields: meetingId, memberId, biometricType, biometricData' },
        { status: 400 }
      );
    }

    if (!mongoose.isValidObjectId(meetingId) || !mongoose.isValidObjectId(memberId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    const biometricProfile = await BiometricProfile.findOne({
      memberId,
      biometricType,
      isActive: true,
    });

    if (!biometricProfile) {
      return NextResponse.json({
        verified: false,
        error: 'No biometric profile enrolled for this member',
        needsEnrollment: true,
      }, { status: 200 });
    }

    const inputHash = crypto
      .createHash('sha256')
      .update(biometricData)
      .digest('hex');

    if (inputHash !== biometricProfile.biometricTemplate) {
      return NextResponse.json({
        verified: false,
        error: 'Biometric verification failed. Please try again.',
      }, { status: 200 });
    }

    await BiometricProfile.findByIdAndUpdate(biometricProfile._id, {
      lastUsed: new Date(),
    });

    const settings = await Settings.findOne().lean() as SettingsDoc | null;
    const financialSettings = await FinancialSettings.findOne().lean() as FinancialSettingsDoc | null;
    const bonusAmount = financialSettings?.bonusPerAttendance || settings?.monthlyContribution || 1000;

    const meetingIdObj = new mongoose.Types.ObjectId(meetingId);
    const memberIdObj = new mongoose.Types.ObjectId(memberId);
    
    let attendance = await Attendance.findOne({ meetingId: meetingIdObj, memberId: memberIdObj });

    if (attendance) {
      if (attendance.bonusAllocated) {
        return NextResponse.json({
          verified: true,
          alreadyCheckedIn: true,
          bonusAmount: attendance.bonusAmount,
          attendance: {
            memberId: attendance.memberId?.toString(),
            status: attendance.status,
            timestamp: attendance.verifiedAt?.toISOString(),
          },
        });
      }
      
      attendance.status = 'verified';
      attendance.verifiedAt = new Date();
      attendance.processedAt = new Date();
      attendance.bonusAllocated = true;
      attendance.bonusAmount = bonusAmount;
      attendance.biometricType = biometricType;
      attendance.deviceId = deviceId;
      attendance.checkInMethod = 'biometric';
      attendance.verificationAttempts += 1;
      attendance.lastAttemptAt = new Date();
      
      await attendance.save();
    } else {
      attendance = await Attendance.create({
        meetingId: meetingIdObj,
        memberId: memberIdObj,
        status: 'verified',
        verifiedAt: new Date(),
        processedAt: new Date(),
        bonusAllocated: true,
        bonusAmount,
        biometricType,
        deviceId,
        checkInMethod: 'biometric',
        verificationAttempts: 1,
        lastAttemptAt: new Date(),
      });
    }

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('memberId', 'fullName photoUrl memberId')
      .lean() as any;

    return NextResponse.json({
      verified: true,
      bonusAmount,
      memberId,
      name: populatedAttendance?.memberId?.fullName || 'Unknown',
      photoUrl: populatedAttendance?.memberId?.photoUrl || null,
      attendance: {
        _id: attendance._id?.toString(),
        memberId: attendance.memberId?.toString(),
        status: attendance.status,
        timestamp: attendance.verifiedAt?.toISOString(),
      },
    });
  } catch (error) {
    console.error('Biometric verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}