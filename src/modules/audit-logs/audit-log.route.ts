import { Router } from 'express';

import { loadOrganizationContext, requirePermission } from '../../middlewares/authorization.js';
import validate from '../../middlewares/default/validate.js';

import { auditLogController } from './audit-log.controller.js';
import { auditLogParamsSchema, listAuditLogsSchema } from './audit-log.validation.js';

// Mounted at /organizations/:organizationId/audit-logs
const router = Router({ mergeParams: true });

router.use(loadOrganizationContext);

router.get(
    '/',
    validate(listAuditLogsSchema),
    requirePermission('audit_logs.read'),
    auditLogController.list,
);

router.get(
    '/:auditLogId',
    validate(auditLogParamsSchema),
    requirePermission('audit_logs.read'),
    auditLogController.getById,
);

export default router;
