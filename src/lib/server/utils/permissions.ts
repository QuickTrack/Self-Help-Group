import type { Permission, PermissionScope, UserRole } from '@/types';

const roleDefaultPermissions: Record<UserRole, Permission[]> = {
  admin: [
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
  ],
  treasurer: [
    'dashboard.view',
    'members.view',
    'contributions.view', 'contributions.create',
    'loans.view', 'loans.create', 'loans.approve', 'loans.disburse',
    'savings.view', 'savings.create', 'savings.addTransaction',
    'welfare.view', 'welfare.create',
    'reports.view',
  ],
  secretary: [
    'dashboard.view',
    'members.view', 'members.create',
    'loans.view',
    'savings.view',
    'welfare.view', 'welfare.create',
    'meetings.view', 'meetings.create',
    'announcements.view', 'announcements.create',
    'reports.view',
  ],
  member: [
    'dashboard.view',
    'members.view',
    'loans.view',
    'savings.view',
    'welfare.view',
  ],
};

export function getDefaultPermissions(role: UserRole): Permission[] {
  return roleDefaultPermissions[role] || roleDefaultPermissions.member;
}

export function hasPermission(
  scope: PermissionScope | undefined,
  role: UserRole,
  requiredPermission: Permission
): boolean {
  const defaults = roleDefaultPermissions[role] || roleDefaultPermissions.member;
  const allowed = scope?.allowed && scope.allowed.length > 0 
    ? scope.allowed 
    : defaults;
  
  if (scope?.denied?.includes(requiredPermission as any)) {
    return false;
  }
  
  return allowed.includes(requiredPermission as any);
}

export function mergePermissions(
  scope: PermissionScope | undefined,
  role: UserRole
): Permission[] {
  const defaults = roleDefaultPermissions[role] || roleDefaultPermissions.member;
  
  if (!scope) {
    return defaults;
  }
  
  const hasAllowed = scope.allowed && scope.allowed.length > 0;
  const hasDenied = scope.denied && scope.denied.length > 0;
  
  let result: Permission[];
  
  if (hasAllowed) {
    result = scope.allowed as Permission[];
  } else {
    result = defaults;
  }
  
  if (hasDenied) {
    result = result.filter(p => !scope.denied!.includes(p as any));
  }
  
  return result;
}

export function canAccess(
  scope: PermissionScope | undefined,
  role: UserRole,
  requiredPermissions: Permission[]
): boolean {
  const merged = mergePermissions(scope, role);
  return requiredPermissions.every(p => merged.includes(p as any));
}