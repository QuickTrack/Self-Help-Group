import { NextResponse } from 'next/server';
import dbConnect from '@/lib/server/utils/db';
import { getDefaultPermissions } from '@/lib/server/utils/permissions';
import type { Permission, PermissionScope } from '@/types';
import bcrypt from 'bcryptjs';

interface UserDoc {
  _id: { toString(): string };
  email: string;
  role: string;
  member?: { toString(): string };
  permissionScope?: { allowed?: string[]; denied?: string[] };
  createdAt?: { toISOString(): string };
  updatedAt?: { toISOString(): string };
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    await dbConnect();
    const { User } = await import('@/lib/server/models/User');
    
    const user = await User.findById(id).select('-password').lean() as UserDoc | null;
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const scope = user.permissionScope;
    const allowed = scope?.allowed && scope.allowed.length > 0
      ? scope.allowed
      : getDefaultPermissions(user.role as any);
    const denied = scope?.denied || [];
    const effectivePermissions = allowed.filter((p: string) => !denied.includes(p));
    
    return NextResponse.json({
      user: {
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
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { email, password, role, permissionScope } = body;
    
    if (!email && !password && !role && !permissionScope) {
      return NextResponse.json(
        { error: 'At least one field to update is required' },
        { status: 400 }
      );
    }
    
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }
    
    if (password && password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }
    
    if (role) {
      const validRoles = ['admin', 'treasurer', 'secretary', 'member'];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: 'Invalid role' },
          { status: 400 }
        );
      }
    }
    
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
            return NextResponse.json(
              { error: `Invalid permission: ${p}` },
              { status: 400 }
            );
          }
        }
      }
      
      if (permissionScope.denied) {
        for (const p of permissionScope.denied) {
          if (!validPermissions.includes(p)) {
            return NextResponse.json(
              { error: `Invalid permission: ${p}` },
              { status: 400 }
            );
          }
        }
      }
    }
    
    await dbConnect();
    const { User } = await import('@/lib/server/models/User');
    
    if (email) {
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(), 
        _id: { $ne: id } 
      });
      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 409 }
        );
      }
    }
    
    const updateData: any = {};
    if (email) updateData.email = email.toLowerCase();
    if (password) updateData.password = bcrypt.hashSync(password, 12);
    if (role) updateData.role = role;
    if (permissionScope) {
      updateData.permissionScope = {
        allowed: permissionScope.allowed || [],
        denied: permissionScope.denied || [],
      };
    }
    
    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).select('-password');
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const scope = user.permissionScope;
    const allowed = scope?.allowed && scope.allowed.length > 0
      ? scope.allowed
      : getDefaultPermissions(user.role as any);
    const denied = scope?.denied || [];
    const effectivePermissions = allowed.filter((p: string) => !denied.includes(p));
    
    return NextResponse.json({
      user: {
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
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    await dbConnect();
    const { User } = await import('@/lib/server/models/User');
    
    const user = await User.findByIdAndDelete(id);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
