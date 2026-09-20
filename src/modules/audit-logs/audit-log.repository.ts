import type { Prisma } from '@prisma/client';

import prisma from '../../config/db.js';

import type { AuditLogFilters } from './audit-log.types.js';

const auditLogInclude = {
    actor: { select: { id: true, name: true, email: true } },
} as const;

export const auditLogRepository = {
    async list(organizationId: string, page: number, limit: number, filters: AuditLogFilters) {
        const where: Prisma.AuditLogWhereInput = { organizationId };
        if (filters.userId) where.actorUserId = filters.userId;
        if (filters.action) where.action = filters.action;
        if (filters.targetType) where.targetType = filters.targetType;
        if (filters.from || filters.to) {
            where.createdAt = {
                ...(filters.from ? { gte: filters.from } : {}),
                ...(filters.to ? { lte: filters.to } : {}),
            };
        }

        const [items, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                include: auditLogInclude,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.auditLog.count({ where }),
        ]);

        return { items, total };
    },

    findById(organizationId: string, auditLogId: string) {
        return prisma.auditLog.findFirst({
            where: { id: auditLogId, organizationId },
            include: auditLogInclude,
        });
    },
};
