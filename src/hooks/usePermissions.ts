import { useStore } from '@/stores/useStore';
import { getDefaultPermissions, mergePermissions } from '@/lib/server/utils/permissions';
import type { Permission, PermissionScope } from '@/types';

export function usePermissions() {
  const { user } = useStore();
  
  if (!user) {
    return {
      can: () => false,
      canAny: () => false,
      permissions: [] as Permission[],
    };
  }
  
  const role = (user.role as any) || 'member';
  const scope = (user as any).permissionScope as PermissionScope | undefined;
  const merged = mergePermissions(scope, role as any);
  
  return {
    can: (permission: Permission) => merged.includes(permission),
    canAny: (permissions: Permission[]) => permissions.some(p => merged.includes(p)),
    permissions: merged,
  };
}

export function useHasPermission(permission: Permission): boolean {
  const { can } = usePermissions();
  return can(permission);
}

export function useHasAnyPermission(permissions: Permission[]): boolean {
  const { canAny } = usePermissions();
  return canAny(permissions);
}