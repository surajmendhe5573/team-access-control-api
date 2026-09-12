export interface CreateOrganizationInput {
    name: string;
}

export interface UpdateOrganizationInput {
    name?: string;
}

export const OrgRole = {
    OWNER: 'OWNER',
    ADMIN: 'ADMIN',
    MEMBER: 'MEMBER',
    VIEWER: 'VIEWER',
} as const;

export type OrgRoleType = (typeof OrgRole)[keyof typeof OrgRole];
