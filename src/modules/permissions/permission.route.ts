import { Router } from 'express';

import authenticate from '../../middlewares/authenticate.js';
import validate from '../../middlewares/default/validate.js';

import { permissionController } from './permission.controller.js';
import { permissionIdParamSchema } from './permission.validation.js';

// Global catalog — top-level, no org context needed, just requires login
const router = Router();

router.use(authenticate);

router.get('/', permissionController.list);
router.get('/:permissionId', validate(permissionIdParamSchema), permissionController.getById);

export default router;
