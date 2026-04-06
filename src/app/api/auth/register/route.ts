import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/server/utils/db';
import { User } from '../../../../lib/server/models/User';
import { createToken } from '../../../../lib/server/utils/auth';
import { checkRateLimit } from '../../../../lib/server/utils/rateLimit';

export async function POST(request: NextRequest) {
  try {
    const clientIp = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    await dbConnect();
    
    const body = await request.json();
    const { email, password, role } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    const user = new User({
      email: email.toLowerCase(),
      password,
      role: role || 'member',
    });

    await user.save();

    const token = await createToken(user._id.toString(), user.email, user.role);

    return NextResponse.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}