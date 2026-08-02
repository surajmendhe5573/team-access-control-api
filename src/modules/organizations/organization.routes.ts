import { Router } from 'express';

import authenticate from '../../middlewares/authenticate.js';
import validate from '../../middlewares/default/validate.js';
import memberRoutes from '../members/member.route.js';

import OrganizationController from './organization.controller.js';
import {
    createOrganizationSchema,
    organizationIdParamSchema,
    updateOrganizationSchema,
} from './organization.validation.js';

const router = Router();
const organizationController = new OrganizationController();

router.use(authenticate);
router.use('/:id/members', memberRoutes);

router.post('/', validate(createOrganizationSchema), organizationController.create);
router.get('/', organizationController.list);
router.get('/:id', validate(organizationIdParamSchema), organizationController.getById);
router.patch('/:id', validate(updateOrganizationSchema), organizationController.update);
router.delete('/:id', validate(organizationIdParamSchema), organizationController.remove);

export default router;
