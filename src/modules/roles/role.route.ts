import { Router } from 'express';

import { loadOrganizationContext, requirePermission } from '../../middlewares/authorization.js';
import validate from '../../middlewares/default/validate.js';
import rolePermissionRoutes from '../role-permissions/role-permission.route.js';

import { roleController } from './role.controller.js';
import { createRoleSchema, roleParamsSchema, updateRoleSchema } from './role.validation.js';

// Mounted at /organizations/:organizationId/roles
const router = Router({ mergeParams: true });

router.use(loadOrganizationContext);

router.post(
    '/',
    validate(createRoleSchema),
    requirePermission('roles.create'),
    roleController.create,
);

router.get('/', requirePermission('roles.read'), roleController.list);

router.get(
    '/:roleId',
    validate(roleParamsSchema),
    requirePermission('roles.read'),
    roleController.getById,
);

router.patch(
    '/:roleId',
    validate(updateRoleSchema),
    requirePermission('roles.update'),
    roleController.update,
);

router.delete(
    '/:roleId',
    validate(roleParamsSchema),
    requirePermission('roles.delete'),
    roleController.remove,
);

router.use('/:roleId/permissions', rolePermissionRoutes);

export default router;
