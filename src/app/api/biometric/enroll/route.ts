import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/server/utils/db';
import { BiometricProfile, Member, User } from '@/lib/server/models';
import mongoose from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

interface BiometricEnrollmentBody {
  memberId: string;
  biometricType: 'fingerprint' | 'face' | 'iris';
  biometricData: string;
  consentGiven: boolean;
  consentVersion?: string;
  deviceId?: string;
  adminOverride?: boolean;
  adminPassword?: string;
  adminEmail?: string;
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

function computeBiometricHash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export async function POST(request: NextRequest) {
  console.log('Biometric enrollment request');
  try {
    await dbConnect();
    console.log('Connected to MongoDB');
    
    const body: BiometricEnrollmentBody = await request.json();
    console.log('Enrollment body:', { memberId: body.memberId, biometricType: body.biometricType, dataLength: body.biometricData?.length });
    const { memberId, biometricType, biometricData, consentGiven, consentVersion, adminOverride, adminPassword, adminEmail } = body;

    console.log('Admin override from request:', { adminOverride, adminEmail: !!adminEmail, adminPassword: !!adminPassword });

    // Admin override verification
    if (adminOverride && adminPassword && adminEmail) {
      console.log('Verifying admin:', adminEmail);
      const adminUser = await User.findOne({ email: adminEmail.toLowerCase(), role: 'admin' });
      if (!adminUser) {
        console.log('Admin user not found:', adminEmail);
        return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
      }
      const isValidPassword = await adminUser.comparePassword(adminPassword);
      if (!isValidPassword) {
        console.log('Invalid password for admin:', adminEmail);
        return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 });
      }
      console.log('Admin override verified for:', adminEmail);
    }

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
    
    const biometricDataHash = computeBiometricHash(biometricData);
    console.log('Computed hash:', biometricDataHash);
    
    console.log('Step 5: Checking for duplicate biometric data across other members');
    
    const existingForThisMember = await BiometricProfile.findOne({
      memberId: memberObjectId,
      biometricType,
      isActive: true,
    });
    
    console.log('Existing profile check:', { existingForThisMember: !!existingForThisMember, adminOverride });
    
    if (existingForThisMember) {
      if (!adminOverride) {
        console.log('Member already has this biometric type enrolled - no admin override');
        return NextResponse.json(
          { error: 'Biometric profile already enrolled for this member. Re-enrollment not allowed.' },
          { status: 409 }
        );
      }
      // Admin override - deactivate ALL existing profiles for this member and biometric type
      console.log('Admin override - deactivating ALL existing profiles');
      await BiometricProfile.updateMany(
        { memberId: memberObjectId, biometricType, isActive: true },
        { isActive: false }
      );
    }
    
    // Skip duplicate check for admin override (allows updating face scan)
    if (!adminOverride) {
      let duplicateCheck;
      try {
        if (biometricType === 'face') {
          duplicateCheck = await BiometricProfile.findOne({
            biometricType: 'face',
            isActive: true,
          });
          console.log('Duplicate check result (face):', duplicateCheck ? `Found existing face for member ${duplicateCheck.memberId}` : 'No existing face records');
        } else {
          duplicateCheck = await BiometricProfile.findOne({
            $or: [
              { biometricDataHash: biometricDataHash },
              { biometricTemplate: biometricData }
            ],
            biometricType,
            isActive: true,
          });
          console.log('Duplicate check result:', duplicateCheck ? `Found duplicate for member ${duplicateCheck.memberId}, type: ${duplicateCheck.biometricType}` : 'No duplicate');
        }
      } catch (dbError: any) {
        console.error('Duplicate check error:', dbError);
        if (dbError.code === 11000) {
          return NextResponse.json(
            { error: 'Biometric data already registered. Cannot reuse for another member.' },
            { status: 409 }
          );
        }
        throw dbError;
      }
      
      if (duplicateCheck) {
        console.warn('Biometric data already in use by member:', duplicateCheck.memberId);
        return NextResponse.json(
          { error: 'Biometric data already registered for another member. Each face can only be enrolled once.' },
          { status: 409 }
        );
      }
    }
    
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
      biometricDataHash,
      hashAlgorithm: 'sha256',
      consentGiven: true,
      consentDate: new Date(),
      isActive: true,
      enrolledAt: new Date(),
    });
    
    console.log('Saving biometric profile with biometricDataHash:', biometricDataHash);
    let profileId: mongoose.Types.ObjectId;
    let isNewProfile = false;
    
    try {
      await biometricProfile.save();
      console.log('Biometric profile saved, id:', biometricProfile._id);
      profileId = biometricProfile._id;
      isNewProfile = true;
    } catch (saveError: any) {
      console.error('Save error:', saveError);
      if (saveError.code === 11000) {
        // If admin override, update the existing record instead
        if (adminOverride) {
          console.log('Duplicate key on save - updating existing record');
          const result = await BiometricProfile.findOneAndUpdate(
            { memberId: memberObjectId, biometricType },
            {
              $set: {
                biometricTemplate: templateValue,
                biometricDataHash,
                hashAlgorithm: 'sha256',
                consentGiven: true,
                consentDate: new Date(),
                isActive: true,
                enrolledAt: new Date(),
              }
            },
            { new: true }
          );
          if (result) {
            console.log('Biometric profile updated, id:', result._id);
            profileId = result._id;
          } else {
            return NextResponse.json(
              { error: 'Failed to update biometric profile' },
              { status: 500 }
            );
          }
        } else {
          return NextResponse.json(
            { error: 'Biometric data already registered. Cannot reuse for another member.' },
            { status: 409 }
          );
        }
      } else {
        throw saveError;
      }
    }

    // Update member consent
    const memberUpdate: any = {
      biometricConsentGiven: true,
      biometricConsentDate: new Date(),
      biometricConsentVersion: consentVersion || '1.0',
    };
    
    await Member.findByIdAndUpdate(memberId, memberUpdate);

    return NextResponse.json({
      success: true,
      message: 'Biometric profile enrolled successfully',
      profile: {
        id: profileId,
        memberId,
        biometricType,
        enrolledAt: new Date(),
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