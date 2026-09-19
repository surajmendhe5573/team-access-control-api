export interface CreateInvitationInput {
    email: string;
    roleId: string;
}

export interface SafeInvitation {
    id: string;
    organizationId: string;
    email: string;
    roleId: string;
    roleName: string;
    status: string;
    invitedById: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

export const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
