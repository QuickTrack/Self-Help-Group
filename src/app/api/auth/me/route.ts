import { NextResponse } from 'next/server';
import dbConnect from '@/lib/server/utils/db';
import { getDefaultPermissions, mergePermissions } from '@/lib/server/utils/permissions';

interface UserDoc {
  _id: { toString(): string };
  email: string;
  role: string;
  member?: { toString(): string };
  permissionScope?: { allowed?: string[]; denied?: string[] };
}

export async function GET(request: Request) {
  try {
    const token = request.headers.get('cookie')?.split('token=')[1]?.split(';')[0] ||
                  request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    await dbConnect();
    
    const { User: UserModel } = await import('@/lib/server/models/User');
    const { verifyToken } = await import('@/lib/server/utils/auth');
    
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const user = await UserModel.findById(payload.userId).select('-password').lean() as UserDoc | null;
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }
    
    let memberDetails = null;
    if (user.member) {
      const { Member: MemberModel } = await import('@/lib/server/models/Member');
      memberDetails = await MemberModel.findById(user.member).select('-__v').lean();
    }
    
    const scope = user.permissionScope as any;
    const effectivePermissions = mergePermissions(scope, user.role as any);

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        member: memberDetails,
        permissionScope: { 
          allowed: scope?.allowed || [], 
          denied: scope?.denied || [] 
        },
        effectivePermissions,
      },
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}