import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/server/utils/db';
import { BiometricProfile, Member, Attendance, Meeting, Settings, FinancialSettings } from '@/lib/server/models';
import crypto from 'crypto';
import mongoose from 'mongoose';

interface VerifyRequest {
  memberId: string;
  biometricType: 'fingerprint' | 'face' | 'iris';
  biometricData: string;
  deviceId: string;
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

    const body: VerifyRequest = await request.json();
    const { memberId, biometricType, biometricData, deviceId } = body;

    if (!biometricType || !biometricData) {
      return NextResponse.json(
        { error: 'Missing required fields: biometricType, biometricData' },
        { status: 400 }
      );
    }

    const inputHash = crypto
      .createHash('sha256')
      .update(biometricData)
      .digest('hex');

    let matchedProfile: any = null;
    let targetMemberId = memberId;

    if (memberId && memberId !== 'manual-trigger' && mongoose.isValidObjectId(memberId)) {
      const profile = await BiometricProfile.findOne({
        memberId,
        biometricType,
        isActive: true,
      });

      if (profile && inputHash === profile.biometricTemplate) {
        matchedProfile = profile;
      }
    } else {
      const profiles = await BiometricProfile.find({
        biometricType,
        isActive: true,
      }).lean();

      for (const profile of profiles) {
        if (inputHash === profile.biometricTemplate) {
          matchedProfile = profile;
          break;
        }
      }
    }

    if (!matchedProfile) {
      console.warn(`[Biometric] No matching profile found for type ${biometricType}`);
      
      const allProfiles = await BiometricProfile.countDocuments({ biometricType, isActive: true });
      const message = allProfiles > 0 
        ? 'Biometric verification failed. No match found.'
        : 'No biometric profiles enrolled for this type.';
      
      return NextResponse.json(
        { verified: false, error: message, needsEnrollment: allProfiles === 0 },
        { status: 200 }
      );
    }

    await BiometricProfile.findByIdAndUpdate(matchedProfile._id, {
      lastUsed: new Date(),
    });

    const member = await Member.findById(matchedProfile.memberId).lean() as any;
    if (!member) {
      return NextResponse.json(
        { verified: false, error: 'Member not found' },
        { status: 404 }
      );
    }

    const settings = await Settings.findOne().lean() as any;
    const financialSettings = await FinancialSettings.findOne().lean() as any;
    const bonusAmount = financialSettings?.bonusPerAttendance || settings?.monthlyContribution || 1000;

    const meetingIdObj = new mongoose.Types.ObjectId(meetingId);
    const memberIdObj = matchedProfile.memberId;

    let attendance = await Attendance.findOne({ meetingId: meetingIdObj, memberId: memberIdObj });

    if (attendance) {
      if (attendance.bonusAllocated) {
        return NextResponse.json({
          verified: true,
          alreadyCheckedIn: true,
          bonusAmount: attendance.bonusAmount,
          memberId: memberIdObj.toString(),
          name: member.fullName,
          photoUrl: member.photo,
          attendance: {
            _id: attendance._id?.toString(),
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

    return NextResponse.json({
      verified: true,
      bonusAmount,
      memberId: memberIdObj.toString(),
      name: member.fullName,
      photoUrl: member.photo,
      message: 'Verification successful',
      attendance: {
        _id: attendance._id?.toString(),
        memberId: memberIdObj.toString(),
        status: 'verified',
        timestamp: attendance.verifiedAt?.toISOString(),
      },
    });
  } catch (error) {
    console.error('[Biometric] Verification error:', error);
    return NextResponse.json(
      { verified: false, error: 'Verification service unavailable. Contact admin.' },
      { status: 500 }
    );
  }
}