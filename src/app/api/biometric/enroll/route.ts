import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/server/utils/db';
import { BiometricProfile, Member } from '@/lib/server/models';
import crypto from 'crypto';
import mongoose from 'mongoose';

interface BiometricEnrollmentBody {
  memberId: string;
  biometricType: 'fingerprint' | 'face' | 'iris';
  biometricData: string;
  consentGiven: boolean;
  consentVersion?: string;
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body: BiometricEnrollmentBody = await request.json();
    const { memberId, biometricType, biometricData, consentGiven, consentVersion } = body;

    if (!memberId || !biometricType || !biometricData) {
      return NextResponse.json(
        { error: 'Missing required fields: memberId, biometricType, biometricData' },
        { status: 400 }
      );
    }

    if (!mongoose.isValidObjectId(memberId)) {
      return NextResponse.json({ error: 'Invalid member ID format' }, { status: 400 });
    }

    const member = await Member.findById(memberId);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const existingProfile = await BiometricProfile.findOne({
      memberId,
      biometricType,
      isActive: true,
    });

    if (existingProfile) {
      return NextResponse.json(
        { error: `Biometric profile for ${biometricType} already exists` },
        { status: 409 }
      );
    }

    if (!consentGiven) {
      return NextResponse.json(
        { error: 'Explicit consent required for biometric enrollment' },
        { status: 400 }
      );
    }

    const templateHash = crypto
      .createHash('sha256')
      .update(biometricData)
      .digest('hex');

    const biometricProfile = new BiometricProfile({
      memberId: new mongoose.Types.ObjectId(memberId),
      biometricType,
      biometricTemplate: templateHash,
      hashAlgorithm: 'sha256',
      consentGiven: true,
      consentDate: new Date(),
      isActive: true,
      enrolledAt: new Date(),
    });

    await biometricProfile.save();

    await Member.findByIdAndUpdate(memberId, {
      biometricConsentGiven: true,
      biometricConsentDate: new Date(),
      biometricConsentVersion: consentVersion || '1.0',
    });

    return NextResponse.json({
      success: true,
      message: 'Biometric profile enrolled successfully',
      profile: {
        id: biometricProfile._id,
        memberId,
        biometricType,
        enrolledAt: biometricProfile.enrolledAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Biometric enrollment error:', error);
    return NextResponse.json(
      { error: 'Failed to enroll biometric profile' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    
    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    if (!mongoose.isValidObjectId(memberId)) {
      return NextResponse.json({ error: 'Invalid member ID format' }, { status: 400 });
    }

    const profiles = await BiometricProfile.find({
      memberId,
      isActive: true,
    }).select('-biometricTemplate').lean();

    return NextResponse.json({
      profiles: profiles.map(p => ({
        id: p._id,
        biometricType: p.biometricType,
        enrolledAt: p.enrolledAt,
        lastUsed: p.lastUsed,
      })),
    });
  } catch (error) {
    console.error('Error fetching biometric profiles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch biometric profiles' },
      { status: 500 }
    );
  }
}