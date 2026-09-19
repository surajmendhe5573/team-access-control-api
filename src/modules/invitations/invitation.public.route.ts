import { Router } from 'express';

import authenticate from '../../middlewares/authenticate.js';
import validate from '../../middlewares/default/validate.js';

import { invitationController } from './invitation.controller.js';
import { invitationTokenSchema } from './invitation.validation.js';

// Mounted at /api/v1/invitations — token-based, no org context because the
// invitee is not a member of the organization yet. Still requires login.
const router = Router();

router.use(authenticate);

router.post('/:token/accept', validate(invitationTokenSchema), invitationController.accept);

router.post('/:token/reject', validate(invitationTokenSchema), invitationController.reject);

export default router;
