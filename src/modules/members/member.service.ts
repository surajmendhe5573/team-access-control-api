import type { OrganizationMembershipContext } from '../../middlewares/authorization.js';

import { memberRepository } from './member.repository.js';
import type { SafeMember } from './member.types.js';

class AppError extends Error {
    constructor(
        public code: string,
        public statusCode: number,
        message: string,
    ) {
        super(message);
    }
}

function toSafeMember(member: {
    id: string;
    organizationId: string;
    roleId: string;
    role: { name: string };
    user: { id: string; name: string; email: string };
    createdAt: Date;
    updatedAt: Date;
}): SafeMember {
    return {
        id: member.id,
        organizationId: member.organizationId,
        roleId: member.roleId,
        roleName: member.role.name,
        user: member.user,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
    };
}

export const memberService = {
    async list(organizationId: string, page: number, limit: number) {
        const { items, total } = await memberRepository.listByOrganization(
            organizationId,
            page,
            limit,
        );
        return {
            items: items.map(toSafeMember),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        };
    },

    async getById(organizationId: string, memberId: string): Promise<SafeMember> {
        const member = await memberRepository.findById(organizationId, memberId);
        if (!member) {
            throw new AppError('NOT_FOUND', 404, 'Member not found');
        }
        return toSafeMember(member);
    },

    async updateRole(
        organizationId: string,
        memberId: string,
        newRoleId: string,
        actor: OrganizationMembershipContext,
        meta: { ip?: string; userAgent?: string },
    ): Promise<SafeMember> {
        const target = await memberRepository.findById(organizationId, memberId);
        if (!target) {
            throw new AppError('NOT_FOUND', 404, 'Member not found');
        }

        const newRole = await memberRepository.findRoleInOrganization(organizationId, newRoleId);
        if (!newRole) {
            throw new AppError('NOT_FOUND', 404, 'Role not found in this organization');
        }

        const isGrantingOrRevokingOwner = target.role.name === 'OWNER' || newRole.name === 'OWNER';

        // Only an existing OWNER may promote someone to OWNER or demote an OWNER —
        // prevents an ADMIN from escalating themselves or others to full control.
        if (isGrantingOrRevokingOwner && actor.roleName !== 'OWNER') {
            throw new AppError(
                'FORBIDDEN',
                403,
                'Only an owner can grant or revoke the OWNER role',
            );
        }

        // Block demoting the organization's last remaining OWNER
        if (target.role.name === 'OWNER' && newRole.name !== 'OWNER') {
            const ownerCount = await memberRepository.countOwners(organizationId);
            if (ownerCount <= 1) {
                throw new AppError(
                    'CONFLICT',
                    409,
                    'Cannot change the role of the last remaining owner',
                );
            }
        }

        const updated = await memberRepository.updateRole(memberId, newRoleId);

        await memberRepository.createAuditLog({
            actorUserId: actor.userId,
            organizationId,
            action: 'ROLE_CHANGED',
            targetType: 'OrganizationMember',
            targetId: memberId,
            metadata: { fromRole: target.role.name, toRole: newRole.name },
            ip: meta.ip,
            userAgent: meta.userAgent,
        });

        return toSafeMember(updated);
    },

    async remove(
        organizationId: string,
        memberId: string,
        actor: OrganizationMembershipContext,
        meta: { ip?: string; userAgent?: string },
    ): Promise<void> {
        const target = await memberRepository.findById(organizationId, memberId);
        if (!target) {
            throw new AppError('NOT_FOUND', 404, 'Member not found');
        }

        if (target.role.name === 'OWNER') {
            const ownerCount = await memberRepository.countOwners(organizationId);
            if (ownerCount <= 1) {
                throw new AppError('CONFLICT', 409, 'Cannot remove the last remaining owner');
            }
        }

        await memberRepository.remove(memberId);

        await memberRepository.createAuditLog({
            actorUserId: actor.userId,
            organizationId,
            action: 'MEMBER_REMOVED',
            targetType: 'OrganizationMember',
            targetId: memberId,
            metadata: { removedUserId: target.user.id, roleAtRemoval: target.role.name },
            ip: meta.ip,
            userAgent: meta.userAgent,
        });
    },

    async leave(
        organizationId: string,
        actor: OrganizationMembershipContext,
        meta: { ip?: string; userAgent?: string },
    ): Promise<void> {
        if (actor.roleName === 'OWNER') {
            const ownerCount = await memberRepository.countOwners(organizationId);
            if (ownerCount <= 1) {
                throw new AppError(
                    'CONFLICT',
                    409,
                    'You are the last owner — transfer ownership or delete the organization before leaving',
                );
            }
        }

        await memberRepository.remove(actor.id);

        await memberRepository.createAuditLog({
            actorUserId: actor.userId,
            organizationId,
            action: 'MEMBER_REMOVED',
            targetType: 'OrganizationMember',
            targetId: actor.id,
            metadata: { selfInitiated: true, roleAtRemoval: actor.roleName },
            ip: meta.ip,
            userAgent: meta.userAgent,
        });
    },
};

export { AppError };
