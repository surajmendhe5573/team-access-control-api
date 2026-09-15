import { Router } from 'express';

import authenticate from '../../middlewares/authenticate.js';
import { loadOrganizationContext } from '../../middlewares/authorization.js';
import validate from '../../middlewares/default/validate.js';
import { memberController } from '../members/member.controller.js';
import memberRoutes from '../members/member.route.js';

import { organizationController } from './organization.controller.js';
import {
    createOrganizationSchema,
    organizationIdParamSchema,
    updateOrganizationSchema,
} from './organization.validation.js';

const router = Router();

// every organizations route requires a logged-in user
router.use(authenticate);

router.post('/', validate(createOrganizationSchema), organizationController.create);
router.get('/', organizationController.listMine);
router.get('/:organizationId', validate(organizationIdParamSchema), organizationController.getById);
router.patch('/:organizationId', validate(updateOrganizationSchema), organizationController.update);
router.delete(
    '/:organizationId',
    validate(organizationIdParamSchema),
    organizationController.remove,
);

router.post(
    '/:organizationId/leave',
    validate(organizationIdParamSchema),
    loadOrganizationContext,
    memberController.leave,
);

router.use('/:organizationId/members', memberRoutes);

export default router;
