import { Router } from 'express';

import { loadOrganizationContext, requirePermission } from '../../middlewares/authorization.js';
import validate from '../../middlewares/default/validate.js';

import { invitationController } from './invitation.controller.js';
import {
    createInvitationSchema,
    invitationParamsSchema,
    listInvitationsSchema,
} from './invitation.validation.js';

// Mounted at /organizations/:organizationId/invitations
const router = Router({ mergeParams: true });

router.use(loadOrganizationContext);

router.post(
    '/',
    validate(createInvitationSchema),
    requirePermission('members.invite'),
    invitationController.create,
);

router.get(
    '/',
    validate(listInvitationsSchema),
    requirePermission('members.read'),
    invitationController.list,
);

router.get(
    '/:invitationId',
    validate(invitationParamsSchema),
    requirePermission('members.read'),
    invitationController.getById,
);

router.delete(
    '/:invitationId',
    validate(invitationParamsSchema),
    requirePermission('members.invite'),
    invitationController.cancel,
);

router.post(
    '/:invitationId/resend',
    validate(invitationParamsSchema),
    requirePermission('members.invite'),
    invitationController.resend,
);

export default router;
