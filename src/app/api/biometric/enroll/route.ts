import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/server/utils/db';
import { BiometricProfile, Member } from '@/lib/server/models';
import mongoose from 'mongoose';

interface BiometricEnrollmentBody {
  memberId: string;
  biometricType: 'fingerprint' | 'face' | 'iris';
  biometricData: string;
  consentGiven: boolean;
  consentVersion?: string;
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
  return data.startsWith('data:image') || /^[A-Za-z0-9+/=]+$/.test(data);
}

export async function POST(request: NextRequest) {
  console.log('Biometric enrollment request');
  try {
    await dbConnect();
    console.log('Connected to MongoDB');
    
    const body: BiometricEnrollmentBody = await request.json();
    console.log('Enrollment body:', { memberId: body.memberId, biometricType: body.biometricType, dataLength: body.biometricData?.length });
    const { memberId, biometricType, biometricData, consentGiven, consentVersion } = body;

    if (!memberId || !biometricType || !biometricData) {
      return NextResponse.json(
        { error: 'Missing required fields: memberId, biometricType, biometricData' },
        { status: 400 }
      );
    }

    if (!mongoose.isValidObjectId(memberId)) {
      console.log('Invalid ObjectId:', memberId);
      return NextResponse.json({ error: 'Invalid member ID format' }, { status: 400 });
    }

    const memberObjectId = new mongoose.Types.ObjectId(memberId);
    console.log('Step 1: Looking for member:', memberId, memberObjectId);
    
    const member = await Member.findById(memberId);
    console.log('Step 2: Member result:', member ? `found: ${member.fullName}` : 'NOT FOUND');
    
    if (!member) {
      return NextResponse.json({ error: 'Member not found', givenId: memberId }, { status: 404 });
    }
    
    console.log('Step 3: Checking existing profile for', memberId, biometricType);
    
    const existingProfile = await BiometricProfile.findOne({
      memberId: memberObjectId,
      biometricType,
      isActive: true,
    });
    console.log('Step 4: Existing profile:', existingProfile ? 'found' : 'none');

    let templateValue: string;
    if (biometricType === 'face') {
      if (isValidDescriptor(biometricData)) {
        templateValue = biometricData;
      } else if (isBase64Image(biometricData)) {
        templateValue = biometricData;
      } else {
        return NextResponse.json(
          { error: 'Invalid face data format - expected base64 image or descriptor' },
          { status: 400 }
        );
      }
    } else {
      templateValue = biometricData;
    }

    if (existingProfile) {
      existingProfile.biometricTemplate = templateValue;
      existingProfile.enrolledAt = new Date();
      await existingProfile.save();
      
      return NextResponse.json({
        message: `Biometric profile for ${biometricType} updated successfully`,
        success: true,
      }, {
        status: 200,
      });
    }

    if (!consentGiven) {
      return NextResponse.json(
        { error: 'Explicit consent required for biometric enrollment' },
        { status: 400 }
      );
    }

    const biometricProfile = new BiometricProfile({
      memberId: new mongoose.Types.ObjectId(memberId),
      biometricType,
      biometricTemplate: templateValue,
      hashAlgorithm: 'sha256',
      consentGiven: true,
      consentDate: new Date(),
      isActive: true,
      enrolledAt: new Date(),
    });

    await biometricProfile.save();
    console.log('Biometric profile saved, id:', biometricProfile._id);

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
  } catch (error: any) {
    console.error('Biometric enrollment error FULL:', error);
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    
    let errorMessage = error?.message || 'Unknown error';
    
    if (errorMessage.includes('MongoNetworkError') || errorMessage.includes('connection')) {
      errorMessage = 'Database connection failed. Please ensure MongoDB is running.';
    } else if (error?.name === 'ValidationError') {
      errorMessage = 'Invalid data: ' + errorMessage;
    }
    
    return NextResponse.json(
      { error: 'Failed to enroll biometric profile', details: errorMessage, name: error?.name },
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