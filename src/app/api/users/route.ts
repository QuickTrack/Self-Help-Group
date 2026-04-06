import { NextResponse } from 'next/server';
import dbConnect from '@/lib/server/utils/db';
import { getDefaultPermissions } from '@/lib/server/utils/permissions';
import type { Permission } from '@/types';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    await dbConnect();
    const { User } = await import('@/lib/server/models/User');
    
    const users = await User.find({}, '-password').sort({ createdAt: -1 }).lean();
    
    const serializedUsers = users.map((user: any) => {
      const scope = user.permissionScope;
      const allowed = scope?.allowed && scope.allowed.length > 0
        ? scope.allowed
        : getDefaultPermissions(user.role);
      const denied = scope?.denied || [];
      const effectivePermissions = allowed.filter((p: string) => !denied.includes(p));
      
      return {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        member: user.member?.toString(),
        permissionScope: {
          allowed: scope?.allowed || [],
          denied: scope?.denied || [],
        },
        effectivePermissions,
        createdAt: user.createdAt?.toISOString(),
        updatedAt: user.updatedAt?.toISOString(),
      };
    });
    
    return NextResponse.json({ users: serializedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, role, permissionScope } = body;
    
    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Email, password, and role are required' },
        { status: 400 }
      );
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }
    
    const validRoles = ['admin', 'treasurer', 'secretary', 'member'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }
    
    await dbConnect();
    const { User } = await import('@/lib/server/models/User');
    
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }
    
    const userData: any = {
      email: email.toLowerCase(),
      password: bcrypt.hashSync(password, 12),
      role,
    };
    
    if (permissionScope) {
      const validPermissions = [
        'dashboard.view',
        'members.view', 'members.create', 'members.edit', 'members.delete',
        'contributions.view', 'contributions.create',
        'loans.view', 'loans.create', 'loans.approve', 'loans.disburse',
        'savings.view', 'savings.create', 'savings.addTransaction',
        'welfare.view', 'welfare.create', 'welfare.approve',
        'reports.view',
        'meetings.view', 'meetings.create',
        'announcements.view', 'announcements.create',
        'settings.view', 'settings.edit',
        'users.view', 'users.create', 'users.edit', 'users.delete',
      ];
      
      if (permissionScope.allowed) {
        for (const p of permissionScope.allowed) {
          if (!validPermissions.includes(p)) {
            return NextResponse.json({ error: `Invalid permission: ${p}` }, { status: 400 });
          }
        }
      }
      
      if (permissionScope.denied) {
        for (const p of permissionScope.denied) {
          if (!validPermissions.includes(p)) {
            return NextResponse.json({ error: `Invalid permission: ${p}` }, { status: 400 });
          }
        }
      }
      
      userData.permissionScope = {
        allowed: permissionScope.allowed || [],
        denied: permissionScope.denied || [],
      };
    }
    
    const user = await User.create(userData);
    
    const defaultPerms = getDefaultPermissions(role as any);
    const denied = permissionScope?.denied || [];
    const effectivePermissions = defaultPerms.filter((p: Permission) => !denied.includes(p));
    
    return NextResponse.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        permissionScope: user.permissionScope || { allowed: [], denied: [] },
        effectivePermissions,
        createdAt: user.createdAt?.toISOString(),
        updatedAt: user.updatedAt?.toISOString(),
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
