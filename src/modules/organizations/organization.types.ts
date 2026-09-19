export interface CreateOrganizationInput {
    name: string;
    slug?: string;
}

export interface UpdateOrganizationInput {
    name?: string;
    slug?: string;
}

export interface SafeOrganization {
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
}

export const SYSTEM_ROLES = ['OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'] as const;
export type SystemRoleName = (typeof SYSTEM_ROLES)[number];
