import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/server/utils/db';
import { User } from '../../../../lib/server/models/User';
import { Member } from '../../../../lib/server/models/Member';
import { createToken } from '../../../../lib/server/utils/auth';
import { getDefaultPermissions, mergePermissions } from '../../../../lib/server/utils/permissions';
import type { Permission } from '@/types';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isValidPassword = await user.comparePassword(password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    let memberDetails = null;
    if (user.member) {
      memberDetails = await Member.findById(user.member).select('-__v');
    }

    const token = await createToken(user._id.toString(), user.email, user.role);
    
    const scope = user.permissionScope;
    const effectivePermissions = mergePermissions(scope, user.role as any);

    const response = NextResponse.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        member: memberDetails,
        permissionScope: scope || { allowed: [], denied: [] },
        effectivePermissions,
      },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}