'use client';

import { useStore } from '@/stores/useStore';
import type { Permission } from '@/types';

interface PermissionGuardProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGuard({ permission, children, fallback = null }: PermissionGuardProps) {
  const { user } = useStore();
  
  const permissions = (user as any)?.effectivePermissions || [];
  
  if (!permissions.includes(permission)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

export function useHasPermission(permission: Permission): boolean {
  const { user } = useStore();
  const permissions = (user as any)?.effectivePermissions || [];
  return permissions.includes(permission);
}

export function useHasAnyPermission(permissions: Permission[]): boolean {
  const { user } = useStore();
  const userPermissions = (user as any)?.effectivePermissions || [];
  return permissions.some(p => userPermissions.includes(p));
}