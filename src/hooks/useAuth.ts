'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/stores/useStore';

export function useRequireAuth() {
  const router = useRouter();
  const { isAuthenticated } = useStore();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (!token && !isAuthenticated) {
      router.replace('/');
    }
  }, [token, isAuthenticated, router]);

  return isAuthenticated || !!token;
}

export function useHasPermission(permission: string): boolean {
  const { user } = useStore();
  
  if (!user) return false;
  
  const permissions = (user as any).effectivePermissions || [];
  return permissions.includes(permission);
}

export function useHasAnyPermission(permissions: string[]): boolean {
  const { user } = useStore();
  
  if (!user) return false;
  
  const userPermissions = (user as any).effectivePermissions || [];
  return permissions.some(p => userPermissions.includes(p));
}