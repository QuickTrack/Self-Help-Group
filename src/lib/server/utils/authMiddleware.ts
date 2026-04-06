import { NextRequest, NextResponse } from 'next/server';
import { hasPermission, canAccess } from './permissions';
import type { UserRole, Permission, PermissionScope } from '@/types';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  permissionScope?: PermissionScope;
}

export function getAuthUser(request: NextRequest): AuthUser | null {
  const user = request.headers.get('x-user');
  if (!user) return null;
  
  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
}

export function requirePermissions(
  required: Permission[]
) {
  return (user: AuthUser | null): NextResponse | null => {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!canAccess(user.permissionScope, user.role, required)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    return null;
  };
}

export function requirePermission(permission: Permission) {
  return (user: AuthUser | null): NextResponse | null => {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!hasPermission(user.permissionScope, user.role, permission)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    return null;
  };
}

export function requireRole(...roles: UserRole[]) {
  return (user: AuthUser | null): NextResponse | null => {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!roles.includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    return null;
  };
}