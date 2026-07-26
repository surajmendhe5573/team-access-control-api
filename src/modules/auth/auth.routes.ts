import { Router } from 'express';

import validate from '../../middlewares/default/validate.js';
import AuthController from './auth.controller.js';
import { loginSchema, refreshSchema, signupSchema } from './auth.validation.js';

const router = Router();
const authController = new AuthController();

router.post('/signup', validate(signupSchema), authController.signup);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', authController.logout);
// router.get('/me', authenticate, authController.me);

export default router;