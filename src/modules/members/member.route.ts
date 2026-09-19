import { Router } from 'express';

import { loadOrganizationContext, requirePermission } from '../../middlewares/authorization.js';
import validate from '../../middlewares/default/validate.js';

import { memberController } from './member.controller.js';
import {
    listMembersSchema,
    memberParamsSchema,
    updateMemberRoleSchema,
} from './member.validations.js';

// mergeParams so :organizationId from the parent router (organization.routes.ts)
// is available on req.params here
const router = Router({ mergeParams: true });

// every route below needs org membership resolved first
router.use(loadOrganizationContext);

router.get(
    '/',
    validate(listMembersSchema),
    requirePermission('members.read'),
    memberController.list,
);

router.get(
    '/:memberId',
    validate(memberParamsSchema),
    requirePermission('members.read'),
    memberController.getById,
);

router.patch(
    '/:memberId/role',
    validate(updateMemberRoleSchema),
    requirePermission('members.update'),
    memberController.updateRole,
);

router.delete(
    '/:memberId',
    validate(memberParamsSchema),
    requirePermission('members.remove'),
    memberController.remove,
);

export default router;
