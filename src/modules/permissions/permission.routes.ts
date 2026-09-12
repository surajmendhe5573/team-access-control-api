import { Router } from 'express';

import authenticate from '../../middlewares/authenticate.js';
import validate from '../../middlewares/default/validate.js';

import PermissionController from './permission.controller.js';
import { createPermissionSchema } from './permission.validation.js';

const router = Router();
const permissionController = new PermissionController();

router.use(authenticate);

router.get('/', permissionController.list);
router.post('/', validate(createPermissionSchema), permissionController.create);

export default router;
