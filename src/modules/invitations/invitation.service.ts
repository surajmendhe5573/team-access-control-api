import crypto from 'node:crypto';

import type { OrganizationMembershipContext } from '../../middlewares/authorization.js';

import { invitationRepository } from './invitation.repository.js';
import type { CreateInvitationInput, SafeInvitation } from './invitation.types.js';
import { INVITATION_TTL_MS } from './invitation.types.js';

class AppError extends Error {
    constructor(
        public code: string,
        public statusCode: number,
        message: string,
    ) {
        super(message);
    }
}

function hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function generateRawToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

function toSafeInvitation(invitation: {
    id: string;
    organizationId: string;
    email: string;
    roleId: string;
    role: { name: string };
    status: string;
    invitedById: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}): SafeInvitation {
    return {
        id: invitation.id,
        organizationId: invitation.organizationId,
        email: invitation.email,
        roleId: invitation.roleId,
        roleName: invitation.role.name,
        status: invitation.status,
        invitedById: invitation.invitedById,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
        updatedAt: invitation.updatedAt,
    };
}

// TODO: replace with the real EmailService → AWS SES once that module exists.
function sendInvitationEmail(email: string, rawToken: string, organizationId: string) {
    console.log(`[dev] Invitation token for ${email} (org ${organizationId}): ${rawToken}`);
}

export const invitationService = {
    async create(
        organizationId: string,
        input: CreateInvitationInput,
        actor: OrganizationMembershipContext,
        meta: { ip?: string; userAgent?: string },
    ): Promise<SafeInvitation> {
        const role = await invitationRepository.findRoleInOrganization(
            organizationId,
            input.roleId,
        );
        if (!role) {
            throw new AppError('NOT_FOUND', 404, 'Role not found in this organization');
        }

        // Only an OWNER may invite someone directly as an OWNER.
        if (role.name === 'OWNER' && actor.roleName !== 'OWNER') {
            throw new AppError('FORBIDDEN', 403, 'Only an owner can invite another owner');
        }

        // Already a member of this org?
        const existingUser = await invitationRepository.findUserByEmail(input.email);
        if (existingUser) {
            const membership = await invitationRepository.findMembership(
                existingUser.id,
                organizationId,
            );
            if (membership) {
                throw new AppError(
                    'CONFLICT',
                    409,
                    'This user is already a member of the organization',
                );
            }
        }

        // Duplicate pending invitation?
        const pending = await invitationRepository.findPendingForEmail(organizationId, input.email);
        if (pending) {
            if (pending.expiresAt > new Date()) {
                throw new AppError(
                    'CONFLICT',
                    409,
                    'A pending invitation already exists for this email',
                );
            }
            // stale pending invite — mark it expired so a fresh one can be issued
            await invitationRepository.updateStatus(pending.id, 'EXPIRED');
        }

        const rawToken = generateRawToken();
        const invitation = await invitationRepository.create({
            organizationId,
            email: input.email,
            roleId: input.roleId,
            tokenHash: hashToken(rawToken),
            invitedById: actor.userId,
            expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
        });

        sendInvitationEmail(input.email, rawToken, organizationId);

        await invitationRepository.createAuditLog({
            actorUserId: actor.userId,
            organizationId,
            action: 'INVITATION_CREATED',
            targetType: 'Invitation',
            targetId: invitation.id,
            metadata: { email: input.email, roleName: role.name },
            ip: meta.ip,
            userAgent: meta.userAgent,
        });

        return toSafeInvitation(invitation);
    },

    async list(
        organizationId: string,
        page: number,
        limit: number,
        status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED',
    ) {
        const { items, total } = await invitationRepository.list(
            organizationId,
            page,
            limit,
            status,
        );
        return {
            items: items.map(toSafeInvitation),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        };
    },

    async getById(organizationId: string, invitationId: string): Promise<SafeInvitation> {
        const invitation = await invitationRepository.findById(organizationId, invitationId);
        if (!invitation) {
            throw new AppError('NOT_FOUND', 404, 'Invitation not found');
        }
        return toSafeInvitation(invitation);
    },

    async cancel(
        organizationId: string,
        invitationId: string,
        actor: OrganizationMembershipContext,
        meta: { ip?: string; userAgent?: string },
    ): Promise<void> {
        const invitation = await invitationRepository.findById(organizationId, invitationId);
        if (!invitation) {
            throw new AppError('NOT_FOUND', 404, 'Invitation not found');
        }
        if (invitation.status !== 'PENDING') {
            throw new AppError(
                'CONFLICT',
                409,
                `Cannot cancel an invitation that is already ${invitation.status}`,
            );
        }

        await invitationRepository.updateStatus(invitationId, 'CANCELLED');

        await invitationRepository.createAuditLog({
            actorUserId: actor.userId,
            organizationId,
            action: 'INVITATION_CANCELLED',
            targetType: 'Invitation',
            targetId: invitationId,
            metadata: { email: invitation.email },
            ip: meta.ip,
            userAgent: meta.userAgent,
        });
    },

    async resend(
        organizationId: string,
        invitationId: string,
        actor: OrganizationMembershipContext,
    ): Promise<SafeInvitation> {
        const invitation = await invitationRepository.findById(organizationId, invitationId);
        if (!invitation) {
            throw new AppError('NOT_FOUND', 404, 'Invitation not found');
        }
        if (invitation.status !== 'PENDING') {
            throw new AppError(
                'CONFLICT',
                409,
                `Cannot resend an invitation that is already ${invitation.status}`,
            );
        }

        // Issue a brand-new token — the old one stops working immediately.
        const rawToken = generateRawToken();
        const updated = await invitationRepository.refreshToken(
            invitationId,
            hashToken(rawToken),
            new Date(Date.now() + INVITATION_TTL_MS),
        );

        sendInvitationEmail(invitation.email, rawToken, organizationId);

        return toSafeInvitation(updated);
    },

    async accept(
        rawToken: string,
        userId: string,
        userEmail: string,
        meta: { ip?: string; userAgent?: string },
    ) {
        const invitation = await invitationRepository.findByTokenHash(hashToken(rawToken));
        if (!invitation) {
            throw new AppError('NOT_FOUND', 404, 'Invitation not found');
        }
        if (invitation.status !== 'PENDING') {
            throw new AppError('CONFLICT', 409, `This invitation is already ${invitation.status}`);
        }
        if (invitation.expiresAt < new Date()) {
            await invitationRepository.updateStatus(invitation.id, 'EXPIRED');
            throw new AppError('CONFLICT', 409, 'This invitation has expired');
        }

        // The invitation is bound to an email — only that account may accept it.
        if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
            throw new AppError(
                'FORBIDDEN',
                403,
                'This invitation was issued to a different email address',
            );
        }

        const existingMembership = await invitationRepository.findMembership(
            userId,
            invitation.organizationId,
        );
        if (existingMembership) {
            await invitationRepository.updateStatus(invitation.id, 'ACCEPTED');
            throw new AppError('CONFLICT', 409, 'You are already a member of this organization');
        }

        const member = await invitationRepository.acceptTransaction({
            invitationId: invitation.id,
            userId,
            organizationId: invitation.organizationId,
            roleId: invitation.roleId,
        });

        await invitationRepository.createAuditLog({
            actorUserId: userId,
            organizationId: invitation.organizationId,
            action: 'INVITATION_ACCEPTED',
            targetType: 'Invitation',
            targetId: invitation.id,
            metadata: { roleName: invitation.role.name },
            ip: meta.ip,
            userAgent: meta.userAgent,
        });

        await invitationRepository.createAuditLog({
            actorUserId: userId,
            organizationId: invitation.organizationId,
            action: 'MEMBER_ADDED',
            targetType: 'OrganizationMember',
            targetId: member.id,
            metadata: { viaInvitation: invitation.id, roleName: invitation.role.name },
            ip: meta.ip,
            userAgent: meta.userAgent,
        });

        return {
            id: member.id,
            organizationId: member.organizationId,
            roleId: member.roleId,
            roleName: member.role.name,
            user: member.user,
            createdAt: member.createdAt,
            updatedAt: member.updatedAt,
        };
    },

    async reject(
        rawToken: string,
        userId: string,
        userEmail: string,
        meta: { ip?: string; userAgent?: string },
    ): Promise<void> {
        const invitation = await invitationRepository.findByTokenHash(hashToken(rawToken));
        if (!invitation) {
            throw new AppError('NOT_FOUND', 404, 'Invitation not found');
        }
        if (invitation.status !== 'PENDING') {
            throw new AppError('CONFLICT', 409, `This invitation is already ${invitation.status}`);
        }
        if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
            throw new AppError(
                'FORBIDDEN',
                403,
                'This invitation was issued to a different email address',
            );
        }

        await invitationRepository.updateStatus(invitation.id, 'REJECTED');

        await invitationRepository.createAuditLog({
            actorUserId: userId,
            organizationId: invitation.organizationId,
            action: 'INVITATION_REJECTED',
            targetType: 'Invitation',
            targetId: invitation.id,
            ip: meta.ip,
            userAgent: meta.userAgent,
        });
    },
};

export { AppError };
