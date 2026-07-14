export const PERMISSIONS = {
  MANAGE_USERS: "MANAGE_USERS",         // View and modify public users
  MODERATE_CONTENT: "MODERATE_CONTENT", // View and delete posts/replies/flags
  MANAGE_FINANCE: "MANAGE_FINANCE",     // Approve/reject withdrawals, view analytics
  MANAGE_SYSTEM: "MANAGE_SYSTEM",       // Manage settings, ads, other admins
};

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(
  userPermissions: string[] | null, 
  requiredPermission: Permission, 
  userRoleName: string
) {
  // Super admins bypass all permission checks
  if (userRoleName === "super_admin") return true;
  
  if (!userPermissions) return false;
  return userPermissions.includes(requiredPermission);
}
