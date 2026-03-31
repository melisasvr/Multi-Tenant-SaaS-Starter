import type { Role } from '@/types'

// Role hierarchy: owner > admin > member
const ROLE_RANK: Record<Role, number> = {
  owner: 3,
  admin: 2,
  member: 1,
}

export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[requiredRole]
}

export function canManageMembers(role: Role): boolean {
  return hasRole(role, 'admin')
}

export function canManageBilling(role: Role): boolean {
  return hasRole(role, 'owner')
}

export function canDeleteOrg(role: Role): boolean {
  return role === 'owner'
}

export function canChangeRole(
  actorRole: Role,
  targetRole: Role,
  newRole: Role
): boolean {
  // Cannot change roles at or above your own level (except owners can do anything)
  if (actorRole === 'owner') return true
  return (
    ROLE_RANK[actorRole] > ROLE_RANK[targetRole] &&
    ROLE_RANK[actorRole] > ROLE_RANK[newRole]
  )
}
