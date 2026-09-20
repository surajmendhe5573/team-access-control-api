import { Router } from 'express';

import authenticate from '../../middlewares/authenticate.js';
import validate from '../../middlewares/default/validate.js';

import { sessionController } from './session.controller.js';
import { sessionIdParamSchema } from './session.validation.js';

// Top-level — sessions belong to the user, not a tenant, so no org context
const router = Router();

router.use(authenticate);

router.get('/', sessionController.list);

// specific routes before the :sessionId param route, or "others" would
// be swallowed as a sessionId value
router.delete('/others', sessionController.revokeOthers);
router.delete('/', sessionController.revokeAll);

router.get('/:sessionId', validate(sessionIdParamSchema), sessionController.getById);
router.delete('/:sessionId', validate(sessionIdParamSchema), sessionController.revokeOne);

export default router;
