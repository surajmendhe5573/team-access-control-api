export interface SafeRolePermissions {
    roleId: string;
    roleName: string;
    permissions: { id: string; key: string; description: string | null }[];
}

// OWNER must always retain these — an org can never end up with no role
// capable of deleting itself, updating roles, or removing members.
export const OWNER_SAFETY_FLOOR = ['organization.delete', 'members.remove', 'roles.update'];

// Only an OWNER may grant these to any role — prevents an ADMIN who has
// permissions.assign from escalating a role (including their own) to
// OWNER-equivalent power through the back door.
export const DANGEROUS_PERMISSIONS = [
    'organization.delete',
    'roles.delete',
    'roles.update',
    'permissions.assign',
    'members.remove',
];
