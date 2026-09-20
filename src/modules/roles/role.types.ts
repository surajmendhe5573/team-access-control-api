export interface CreateRoleInput {
    name: string;
}

export interface UpdateRoleInput {
    name?: string;
}

export interface SafeRole {
    id: string;
    organizationId: string;
    name: string;
    isSystem: boolean;
    createdAt: Date;
    updatedAt: Date;
}
