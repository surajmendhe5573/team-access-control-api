export const PERMISSIONS = {
    USERS_READ: 'users.read',
    USERS_WRITE: 'users.write',
    USERS_INVITE: 'users.invite',
    BILLING_READ: 'billing.read',
    BILLING_WRITE: 'billing.write',
    PROJECTS_READ: 'projects.read',
    PROJECTS_WRITE: 'projects.write',
    SESSIONS_READ: 'sessions.read',
    SESSIONS_REVOKE: 'sessions.revoke',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionKey[]> = {
    OWNER: Object.values(PERMISSIONS),
    ADMIN: [
        PERMISSIONS.USERS_READ,
        PERMISSIONS.USERS_WRITE,
        PERMISSIONS.USERS_INVITE,
        PERMISSIONS.PROJECTS_READ,
        PERMISSIONS.PROJECTS_WRITE,
        PERMISSIONS.SESSIONS_READ,
        PERMISSIONS.SESSIONS_REVOKE,
    ],
    MEMBER: [PERMISSIONS.PROJECTS_READ, PERMISSIONS.PROJECTS_WRITE, PERMISSIONS.USERS_READ],
    VIEWER: [PERMISSIONS.PROJECTS_READ, PERMISSIONS.USERS_READ],
};
