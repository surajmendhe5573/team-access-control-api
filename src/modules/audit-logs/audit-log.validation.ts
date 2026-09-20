import { z } from 'zod';

export const listAuditLogsSchema = z.object({
    params: z.object({
        organizationId: z.string().uuid(),
    }),
    query: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        userId: z.string().uuid().optional(),
        action: z.string().optional(),
        targetType: z.string().optional(),
        from: z.coerce.date().optional(),
        to: z.coerce.date().optional(),
    }),
});

export const auditLogParamsSchema = z.object({
    params: z.object({
        organizationId: z.string().uuid(),
        auditLogId: z.string().uuid(),
    }),
});
