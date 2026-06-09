import type { User, ActiveRole, Role } from '@/types';

/**
 * Check if user has a specific role
 */
export function hasRole(user: User | null, role: Role): boolean {
  if (!user) return false;
  return user.roles.includes(role);
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(user: User | null, roles: Role[]): boolean {
  if (!user) return false;
  return roles.some(role => user.roles.includes(role));
}

/**
 * Check if user has all of the specified roles
 */
export function hasAllRoles(user: User | null, roles: Role[]): boolean {
  if (!user) return false;
  return roles.every(role => user.roles.includes(role));
}

/**
 * Check if user's active role matches the specified role
 */
export function hasActiveRole(user: User | null, role: ActiveRole): boolean {
  if (!user) return false;
  return user.activeRole === role;
}

/**
 * Check if user can switch to a specific role
 */
export function canSwitchToRole(user: User | null, role: ActiveRole): boolean {
  if (!user) return false;
  return user.roles.includes(role);
}

/**
 * Get available roles for switching
 */
export function getSwitchableRoles(user: User | null): ActiveRole[] {
  if (!user) return [];
  return user.roles as ActiveRole[];
}

/**
 * Check if user is a teacher (has TEACHER role)
 */
export function isTeacher(user: User | null): boolean {
  return hasRole(user, 'TEACHER');
}

/**
 * Check if user is an admin (has ADMIN role)
 */
export function isAdmin(user: User | null): boolean {
  return hasRole(user, 'ADMIN');
}

/**
 * Check if user is a student (has STUDENT role)
 */
export function isStudent(user: User | null): boolean {
  return hasRole(user, 'STUDENT');
}

/**
 * Check if user has a pending teacher application
 */
export function hasPendingTeacherApplication(user: User | null, teacherApplicationStatus?: string | null): boolean {
  if (!user) return false;
  if (hasRole(user, 'TEACHER')) return false;
  return teacherApplicationStatus === 'PENDING';
}

/**
 * Check if user can apply as teacher
 */
export function canApplyAsTeacher(user: User | null, teacherApplicationStatus?: string | null): boolean {
  if (!user) return false;
  if (hasRole(user, 'TEACHER')) return false;
  return teacherApplicationStatus !== 'PENDING';
}

/**
 * Get user's role hierarchy level (higher number = higher privilege)
 */
export function getRoleHierarchy(role: Role): number {
  const hierarchy: Record<Role, number> = {
    STUDENT: 1,
    TEACHER: 2,
    ADMIN: 3,
  };
  return hierarchy[role] || 0;
}

/**
 * Check if user has higher or equal privilege than target role
 */
export function hasRoleLevel(user: User | null, targetRole: Role): boolean {
  if (!user) return false;
  const userMaxLevel = Math.max(...user.roles.map(getRoleHierarchy));
  const targetLevel = getRoleHierarchy(targetRole);
  return userMaxLevel >= targetLevel;
}

/**
 * Check if user can access admin routes
 */
export function canAccessAdmin(user: User | null): boolean {
  return hasRole(user, 'ADMIN');
}

/**
 * Check if user can access teacher routes
 */
export function canAccessTeacher(user: User | null): boolean {
  return hasRole(user, 'TEACHER') || hasRole(user, 'ADMIN');
}

/**
 * Check if user can access student routes
 */
export function canAccessStudent(user: User | null): boolean {
  return hasRole(user, 'STUDENT') || hasRole(user, 'TEACHER') || hasRole(user, 'ADMIN');
}
