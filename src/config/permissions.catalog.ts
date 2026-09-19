export const PERMISSIONS = [
    { key: 'users.read', description: 'View user profiles' },
    { key: 'users.update', description: 'Update user profiles' },

    { key: 'members.read', description: 'View organization members' },
    { key: 'members.invite', description: 'Invite new members to an organization' },
    { key: 'members.update', description: 'Update a member (e.g. change role)' },
    { key: 'members.remove', description: 'Remove a member from an organization' },

    { key: 'roles.read', description: 'View roles' },
    { key: 'roles.create', description: 'Create custom roles' },
    { key: 'roles.update', description: 'Update roles and their permissions' },
    { key: 'roles.delete', description: 'Delete custom roles' },

    { key: 'permissions.read', description: 'View the permission catalog' },
    { key: 'permissions.assign', description: 'Assign or remove permissions on a role' },

    { key: 'organization.read', description: 'View organization details' },
    { key: 'organization.update', description: 'Update organization details' },
    { key: 'organization.delete', description: 'Delete an organization' },

    { key: 'sessions.read', description: 'View sessions' },
    { key: 'sessions.revoke', description: 'Revoke sessions' },

    { key: 'audit_logs.read', description: 'View audit logs' },
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number]['key'];

const ALL_PERMISSION_KEYS: PermissionKey[] = PERMISSIONS.map((p) => p.key);

// Default permission sets granted to each system role when an organization
// is created. OWNER always gets everything; ADMIN gets everything except
// deleting the org itself.
export const DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionKey[]> = {
    OWNER: [...ALL_PERMISSION_KEYS],
    ADMIN: ALL_PERMISSION_KEYS.filter((key) => key !== 'organization.delete'),
    MANAGER: [
        'members.read',
        'members.invite',
        'members.update',
        'roles.read',
        'organization.read',
        'sessions.read',
        'audit_logs.read',
    ],
    MEMBER: ['members.read', 'roles.read', 'organization.read'],
    VIEWER: ['members.read', 'organization.read'],
};
