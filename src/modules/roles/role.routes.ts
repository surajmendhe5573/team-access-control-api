import { Router } from 'express';

import validate from '../../middlewares/default/validate.js';

import RoleController from './role.controller.js';
import {
    createRoleSchema,
    organizationIdParamSchema,
    roleIdParamSchema,
    updateRolePermissionsSchema,
    updateRoleSchema,
} from './role.validation.js';

const router = Router({ mergeParams: true }); // needs :id from parent organization router
const roleController = new RoleController();

router.get('/', validate(organizationIdParamSchema), roleController.list);
router.post('/', validate(createRoleSchema), roleController.create);
router.patch('/:roleId', validate(updateRoleSchema), roleController.update);
router.patch(
    '/:roleId/permissions',
    validate(updateRolePermissionsSchema),
    roleController.updatePermissions,
);
router.delete('/:roleId', validate(roleIdParamSchema), roleController.remove);

export default router;
