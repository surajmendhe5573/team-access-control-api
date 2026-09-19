import type { NextFunction, Request, Response } from 'express';

import { statusCode } from '../../utils/statusCode.js';

import { authService } from './auth.service.js';
import type {
    ChangePasswordBody,
    LoginBody,
    RegisterBody,
    ResetPasswordBody,
} from './auth.validation.js';

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function setRefreshCookie(res: Response, token: string) {
    res.cookie(REFRESH_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: REFRESH_COOKIE_MAX_AGE_MS,
        path: '/api/v1/auth',
    });
}

function getRefreshTokenFromRequest(req: Request): string | undefined {
    return req.cookies?.[REFRESH_COOKIE_NAME] ?? req.body?.refreshToken;
}

export const authController = {
    async register(req: Request, res: Response, next: NextFunction) {
        try {
            const body = req.body as RegisterBody;
            const result = await authService.register(body);
            res.success(
                'Registered successfully. Please verify your email.',
                result,
                statusCode.CREATED,
            );
        } catch (err) {
            next(err);
        }
    },

    async verifyEmail(req: Request, res: Response, next: NextFunction) {
        try {
            const { token } = req.body as { token: string };
            await authService.verifyEmail(token);
            res.success('Email verified successfully', {}, statusCode.OK);
        } catch (err) {
            next(err);
        }
    },

    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const body = req.body as LoginBody;
            const { tokens, user } = await authService.login(body, {
                userAgent: req.headers['user-agent'],
                ip: req.ip,
            });

            setRefreshCookie(res, tokens.refreshToken);

            res.success(
                'Login successful',
                {
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                    expiresIn: tokens.expiresIn,
                    user,
                },
                statusCode.OK,
            );
        } catch (err) {
            next(err);
        }
    },

    async refresh(req: Request, res: Response, next: NextFunction) {
        try {
            const refreshToken = getRefreshTokenFromRequest(req);
            if (!refreshToken) {
                res.fail('Refresh token missing', statusCode.UNAUTHORIZED);
                return;
            }

            const tokens = await authService.refresh(refreshToken);
            setRefreshCookie(res, tokens.refreshToken);

            res.success(
                'Token refreshed',
                {
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                    expiresIn: tokens.expiresIn,
                },
                statusCode.OK,
            );
        } catch (err) {
            next(err);
        }
    },

    async logout(req: Request, res: Response, next: NextFunction) {
        try {
            const refreshToken = getRefreshTokenFromRequest(req);
            if (refreshToken) {
                await authService.logout(refreshToken);
            }
            res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/v1/auth' });
            res.success('Logged out successfully', {}, statusCode.OK);
        } catch (err) {
            next(err);
        }
    },

    async logoutAll(req: Request, res: Response, next: NextFunction) {
        try {
            await authService.logoutAll(req.user!.id);
            res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/v1/auth' });
            res.success('Logged out from all devices', {}, statusCode.OK);
        } catch (err) {
            next(err);
        }
    },

    async me(req: Request, res: Response, next: NextFunction) {
        try {
            const user = await authService.getMe(req.user!.id);
            res.success('OK', user, statusCode.OK);
        } catch (err) {
            next(err);
        }
    },

    async changePassword(req: Request, res: Response, next: NextFunction) {
        try {
            const { currentPassword, newPassword } = req.body as ChangePasswordBody;
            await authService.changePassword(req.user!.id, currentPassword, newPassword);
            res.success('Password changed successfully', {}, statusCode.OK);
        } catch (err) {
            next(err);
        }
    },

    async forgotPassword(req: Request, res: Response, next: NextFunction) {
        try {
            const { email } = req.body as { email: string };
            await authService.forgotPassword(email);
            res.success(
                'If an account exists for this email, a reset link has been sent.',
                {},
                statusCode.OK,
            );
        } catch (err) {
            next(err);
        }
    },

    async resetPassword(req: Request, res: Response, next: NextFunction) {
        try {
            const { token, newPassword } = req.body as ResetPasswordBody;
            await authService.resetPassword(token, newPassword);
            res.success('Password reset successfully', {}, statusCode.OK);
        } catch (err) {
            next(err);
        }
    },
};
