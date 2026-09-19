export interface SafeMember {
    id: string;
    organizationId: string;
    roleId: string;
    roleName: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

export interface UpdateMemberRoleInput {
    roleId: string;
}
