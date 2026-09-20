import { auditLogRepository } from './audit-log.repository.js';
import type { AuditLogFilters, SafeAuditLog } from './audit-log.types.js';

class AppError extends Error {
    constructor(
        public code: string,
        public statusCode: number,
        message: string,
    ) {
        super(message);
    }
}

function toSafeAuditLog(log: {
    id: string;
    actorUserId: string;
    organizationId: string | null;
    action: string;
    targetType: string | null;
    targetId: string | null;
    ip: string | null;
    userAgent: string | null;
    metadata: unknown;
    requestId: string | null;
    createdAt: Date;
    actor: { id: string; name: string; email: string } | null;
}): SafeAuditLog {
    return {
        id: log.id,
        actorUserId: log.actorUserId,
        organizationId: log.organizationId,
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        ip: log.ip,
        userAgent: log.userAgent,
        metadata: log.metadata,
        requestId: log.requestId,
        createdAt: log.createdAt,
        actor: log.actor,
    };
}

export const auditLogService = {
    async list(organizationId: string, page: number, limit: number, filters: AuditLogFilters) {
        const { items, total } = await auditLogRepository.list(
            organizationId,
            page,
            limit,
            filters,
        );
        return {
            items: items.map(toSafeAuditLog),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        };
    },

    async getById(organizationId: string, auditLogId: string): Promise<SafeAuditLog> {
        const log = await auditLogRepository.findById(organizationId, auditLogId);
        if (!log) {
            throw new AppError('NOT_FOUND', 404, 'Audit log entry not found');
        }
        return toSafeAuditLog(log);
    },
};

export { AppError };
