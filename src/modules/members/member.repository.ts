import type { Prisma } from '@prisma/client';

import prisma from '../../config/db.js';

const memberInclude = {
    user: { select: { id: true, name: true, email: true } },
    role: { select: { id: true, name: true } },
} as const;

export const memberRepository = {
    async listByOrganization(organizationId: string, page: number, limit: number) {
        const [items, total] = await Promise.all([
            prisma.organizationMember.findMany({
                where: { organizationId },
                include: memberInclude,
                orderBy: { createdAt: 'asc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.organizationMember.count({ where: { organizationId } }),
        ]);
        return { items, total };
    },

    findById(organizationId: string, memberId: string) {
        return prisma.organizationMember.findFirst({
            where: { id: memberId, organizationId },
            include: memberInclude,
        });
    },

    findRoleInOrganization(organizationId: string, roleId: string) {
        return prisma.role.findFirst({ where: { id: roleId, organizationId } });
    },

    updateRole(memberId: string, roleId: string) {
        return prisma.organizationMember.update({
            where: { id: memberId },
            data: { roleId },
            include: memberInclude,
        });
    },

    remove(memberId: string) {
        return prisma.organizationMember.delete({ where: { id: memberId } });
    },

    countOwners(organizationId: string) {
        return prisma.organizationMember.count({
            where: { organizationId, role: { name: 'OWNER' } },
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
