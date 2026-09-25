import { Router } from 'express';

import authenticate from '../../middlewares/authenticate.js';
import {
    forgotPasswordRateLimiter,
    loginRateLimiter,
    refreshRateLimiter,
    registerRateLimiter,
} from '../../middlewares/default/authRateLimiters.js';
import validate from '../../middlewares/default/validate.js';

import { authController } from './auth.controller.js';
import {
    changePasswordSchema,
    forgotPasswordSchema,
    loginSchema,
    refreshSchema,
    registerSchema,
    resetPasswordSchema,
    verifyEmailSchema,
} from './auth.validation.js';

const router = Router();

// Public
router.post('/register', registerRateLimiter, validate(registerSchema), authController.register);
router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);
router.post('/login', loginRateLimiter, validate(loginSchema), authController.login);
router.post('/refresh', refreshRateLimiter, validate(refreshSchema), authController.refresh);
router.post(
    '/forgot-password',
    forgotPasswordRateLimiter,
    validate(forgotPasswordSchema),
    authController.forgotPassword,
);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// Authenticated
router.post('/logout', authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.get('/me', authenticate, authController.me);
router.post(
    '/change-password',
    authenticate,
    validate(changePasswordSchema),
    authController.changePassword,
);

export default router;
