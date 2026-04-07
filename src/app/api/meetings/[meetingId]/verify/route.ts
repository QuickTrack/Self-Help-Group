import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/server/utils/db';
import { BiometricProfile, Member, Attendance, Meeting, Settings, FinancialSettings } from '@/lib/server/models';
import mongoose from 'mongoose';

interface VerifyRequest {
  memberId: string;
  biometricType: 'fingerprint' | 'face' | 'iris';
  biometricData: string;
  deviceId: string;
}

function compareDescriptors(desc1: number[], desc2: number[]): number {
  if (!desc1 || !desc2 || desc1.length !== desc2.length) {
    return 1;
  }
  
  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    const diff = desc1[i] - desc2[i];
    sum += diff * diff;
  }
  
  return Math.sqrt(sum);
}

function areFacesMatching(desc1: number[], desc2: number[], threshold: number = 0.6): boolean {
  const distance = compareDescriptors(desc1, desc2);
  return distance < threshold;
}

function isValidDescriptor(data: string): boolean {
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length === 128;
  } catch {
    return false;
  }
}

function isBase64Image(data: string): boolean {
  return data.startsWith('data:image') || (data.length > 100 && /^[A-Za-z0-9+/=]+$/.test(data));
}

function compareImages(img1: string, img2: string): number {
  const base64Data1 = img1.includes(',') ? img1.split(',')[1] : img1;
  const base64Data2 = img2.includes(',') ? img2.split(',')[1] : img2;
  
  const len1 = base64Data1.length;
  const len2 = base64Data2.length;
  const maxLen = Math.max(len1, len2);
  const minLen = Math.min(len1, len2);
  
  if (maxLen === 0) return 1;
  
  const lengthDiff = (maxLen - minLen) / maxLen;
  
  let diff = 0;
  const compareLen = Math.min(len1, len2);
  for (let i = 0; i < compareLen; i += 10) {
    if (base64Data1[i] !== base64Data2[i]) {
      diff++;
    }
  }
  
  const charDiff = diff / (compareLen / 10);
  
  return (lengthDiff + charDiff) / 2;
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

    let matchedProfile: any = null;

    if (biometricType === 'face') {
      if (isValidDescriptor(biometricData)) {
        const inputDescriptor = JSON.parse(biometricData);

        if (memberId && memberId !== 'manual-trigger' && mongoose.isValidObjectId(memberId)) {
          const profile = await BiometricProfile.findOne({
            memberId,
            biometricType,
            isActive: true,
          });

          if (profile) {
            try {
              const storedDescriptor = JSON.parse(profile.biometricTemplate);
              if (areFacesMatching(inputDescriptor, storedDescriptor)) {
                matchedProfile = profile;
              }
            } catch (e) {
              console.error('Error parsing stored descriptor:', e);
            }
          }
        } else {
          const profiles = await BiometricProfile.find({
            biometricType,
            isActive: true,
          }).lean();

          for (const profile of profiles) {
            try {
              const storedDescriptor = JSON.parse(profile.biometricTemplate);
              if (areFacesMatching(inputDescriptor, storedDescriptor)) {
                matchedProfile = profile;
                break;
              }
            } catch (e) {
              console.error('Error parsing stored descriptor:', e);
            }
          }
        }
      } else if (isBase64Image(biometricData)) {
        if (memberId && memberId !== 'manual-trigger' && mongoose.isValidObjectId(memberId)) {
          const profile = await BiometricProfile.findOne({
            memberId,
            biometricType,
            isActive: true,
          });

          if (profile && isBase64Image(profile.biometricTemplate)) {
            const similarity = compareImages(biometricData, profile.biometricTemplate);
            if (similarity < 0.35) {
              matchedProfile = profile;
            }
          }
        } else {
          const profiles = await BiometricProfile.find({
            biometricType,
            isActive: true,
          }).lean();

          for (const profile of profiles) {
            if (isBase64Image(profile.biometricTemplate)) {
              const similarity = compareImages(biometricData, profile.biometricTemplate);
              if (similarity < 0.35) {
                matchedProfile = profile;
                break;
              }
            }
          }
        }
      } else {
        return NextResponse.json(
          { verified: false, error: 'Invalid face data format' },
          { status: 400 }
        );
      }
    } else {
      const inputHash = biometricData;
      
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