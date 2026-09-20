import type { NextFunction, Request, Response } from 'express';

import { statusCode } from '../../utils/statusCode.js';

import { auditLogService } from './audit-log.service.js';

export const auditLogController = {
    async list(req: Request<{ organizationId: string }>, res: Response, next: NextFunction) {
        try {
            const { organizationId } = req.params;
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 20;
            const filters = {
                userId: req.query.userId as string | undefined,
                action: req.query.action as string | undefined,
                targetType: req.query.targetType as string | undefined,
                from: req.query.from ? new Date(req.query.from as string) : undefined,
                to: req.query.to ? new Date(req.query.to as string) : undefined,
            };
            const result = await auditLogService.list(organizationId, page, limit, filters);
            res.success('OK', result, statusCode.OK);
        } catch (err) {
            next(err);
        }
    },

    async getById(
        req: Request<{ organizationId: string; auditLogId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const { organizationId, auditLogId } = req.params;
            const log = await auditLogService.getById(organizationId, auditLogId);
            res.success('OK', log, statusCode.OK);
        } catch (err) {
            next(err);
        }
    },
};
