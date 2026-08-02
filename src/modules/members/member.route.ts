import { Router } from 'express';

import authenticate from '../../middlewares/authenticate.js';
import validate from '../../middlewares/default/validate.js';

import MemberController from './member.controller.js';
import {
    addMemberSchema,
    memberIdParamSchema,
    organizationIdParamSchema,
} from './member.validation.js';

const router = Router({ mergeParams: true }); // needed to access :id from the parent router
const memberController = new MemberController();

router.use(authenticate);

router.get('/', validate(organizationIdParamSchema), memberController.list);
router.get('/:memberId', validate(memberIdParamSchema), memberController.getById);
router.post('/', validate(addMemberSchema), memberController.add);
router.delete('/:memberId', validate(memberIdParamSchema), memberController.remove);

export default router;
