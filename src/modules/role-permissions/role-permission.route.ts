import { Router } from 'express';

import { requirePermission } from '../../middlewares/authorization.js';
import validate from '../../middlewares/default/validate.js';

import { rolePermissionController } from './role-permission.controller.js';
import {
    assignPermissionSchema,
    removePermissionSchema,
    replacePermissionsSchema,
    roleIdParamsSchema,
} from './role-permission.validation.js';

// Mounted at /organizations/:organizationId/roles/:roleId/permissions
// loadOrganizationContext already ran in the parent role.route.ts
const router = Router({ mergeParams: true });

router.get(
    '/',
    validate(roleIdParamsSchema),
    requirePermission('roles.read'),
    rolePermissionController.list,
);

router.post(
    '/',
    validate(assignPermissionSchema),
    requirePermission('permissions.assign'),
    rolePermissionController.assign,
);

router.put(
    '/',
    validate(replacePermissionsSchema),
    requirePermission('permissions.assign'),
    rolePermissionController.replaceAll,
);

router.delete(
    '/:permissionId',
    validate(removePermissionSchema),
    requirePermission('permissions.assign'),
    rolePermissionController.remove,
);

export default router;
