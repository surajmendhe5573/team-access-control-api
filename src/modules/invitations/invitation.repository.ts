import type { Prisma } from '@prisma/client';

import prisma from '../../config/db.js';

const invitationInclude = {
    role: { select: { id: true, name: true } },
} as const;

export const invitationRepository = {
    create(data: {
        organizationId: string;
        email: string;
        roleId: string;
        tokenHash: string;
        invitedById: string;
        expiresAt: Date;
    }) {
        return prisma.invitation.create({ data, include: invitationInclude });
    },

    findById(organizationId: string, invitationId: string) {
        return prisma.invitation.findFirst({
            where: { id: invitationId, organizationId },
            include: invitationInclude,
        });
    },

    findByTokenHash(tokenHash: string) {
        return prisma.invitation.findUnique({
            where: { tokenHash },
            include: invitationInclude,
        });
    },

    findPendingForEmail(organizationId: string, email: string) {
        return prisma.invitation.findFirst({
            where: { organizationId, email, status: 'PENDING' },
            include: invitationInclude,
        });
    },

    async list(
        organizationId: string,
        page: number,
        limit: number,
        status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED',
    ) {
        const where: Prisma.InvitationWhereInput = { organizationId };
        if (status) where.status = status;

        const [items, total] = await Promise.all([
            prisma.invitation.findMany({
                where,
                include: invitationInclude,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.invitation.count({ where }),
        ]);

        return { items, total };
    },

    updateStatus(invitationId: string, status: 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED') {
        return prisma.invitation.update({
            where: { id: invitationId },
            data: { status },
            include: invitationInclude,
        });
    },

    // Rotates the token on resend: new secure token, new hash, new expiry.
    refreshToken(invitationId: string, tokenHash: string, expiresAt: Date) {
        return prisma.invitation.update({
            where: { id: invitationId },
            data: { tokenHash, expiresAt },
            include: invitationInclude,
        });
    },

    findUserByEmail(email: string) {
        return prisma.user.findUnique({ where: { email } });
    },

    findMembership(userId: string, organizationId: string) {
        return prisma.organizationMember.findUnique({
            where: { userId_organizationId: { userId, organizationId } },
        });
    },

    findRoleInOrganization(organizationId: string, roleId: string) {
        return prisma.role.findFirst({ where: { id: roleId, organizationId } });
    },

    // Accepting an invitation must create the membership and close out the
    // invitation atomically — a partial failure would otherwise leave a
    // consumed token with no membership, or a member with a still-open invite.
    acceptTransaction(data: {
        invitationId: string;
        userId: string;
        organizationId: string;
        roleId: string;
    }) {
        return prisma.$transaction(async (tx) => {
            const member = await tx.organizationMember.create({
                data: {
                    userId: data.userId,
                    organizationId: data.organizationId,
                    roleId: data.roleId,
                },
                include: {
                    role: { select: { id: true, name: true } },
                    user: { select: { id: true, name: true, email: true } },
                },
            });

            await tx.invitation.update({
                where: { id: data.invitationId },
                data: { status: 'ACCEPTED' },
            });

            return member;
        });
    },

    createAuditLog(data: {
        actorUserId: string;
        organizationId: string;
        action: string;
        targetType: string;
        targetId: string;
        metadata?: Record<string, unknown>;
        ip?: string;
        userAgent?: string;
    }) {
        return prisma.auditLog.create({
            data: {
                ...data,
                metadata: data.metadata as Prisma.InputJsonValue | undefined,
            },
        });
    },
};
