export const rolePermissions = {
  admin: ['*'],
  manager: ['investments:read', 'investments:write', 'metrics:read', 'users:read', 'wallets:read'],
  support: ['users:read', 'wallets:read'],
  user: [],
}

export const hasPermission = (role, permission) => {
  const permissions = rolePermissions[role] || []
  return permissions.includes('*') || permissions.includes(permission)
}

export const canAccessAdmin = (role) =>
  ['admin', 'manager', 'support'].includes(role)
