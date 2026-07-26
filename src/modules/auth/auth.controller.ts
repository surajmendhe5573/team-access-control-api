import { NextFunction, Request, Response } from 'express';

import AuthService from './auth.service.js';
import { statusCode } from '../../utils/statusCode.js';

const isLocal = process.env.NODE_ENV === 'local';
const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';

const cookieSameSite: 'lax' | 'strict' | 'none' = isDev || isProd ? 'none' : 'lax';
const cookieSecure = isDev || isProd;

const refreshTokenCookieOptions = {
    path: '/api/v1/auth',
    httpOnly: true,
    secure: cookieSecure,
    sameSite: cookieSameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

const clearRefreshTokenOptions = {
    path: '/api/v1/auth',
    httpOnly: true,
    secure: cookieSecure,
    sameSite: cookieSameSite,
};

const REFRESH_COOKIE_NAME = 'refreshToken';

export default class AuthController {
    private authService = AuthService;

    signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const user = await this.authService.signup(req.body);
            res.success('Signup successful, please log in', { user }, statusCode.CREATED);
        } catch (err) {
            next(err);
        }
    };

    login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { accessToken, refreshToken } = await this.authService.login(req.body);

            res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshTokenCookieOptions);
            res.success('Login successful', { accessToken }, statusCode.OK);
        } catch (err) {
            next(err);
        }
    };

    refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const incoming = req.cookies?.[REFRESH_COOKIE_NAME] ?? req.body?.refreshToken;
            if (!incoming) {
                res.success('Refresh token missing', {}, statusCode.UNAUTHORIZED);
                return;
            }

            const { accessToken, refreshToken } = await this.authService.refreshTokens(incoming);

            res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshTokenCookieOptions);
            res.success('Token refreshed', { accessToken }, statusCode.OK);
        } catch (err) {
            next(err);
        }
    };

    logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const incoming = req.cookies?.[REFRESH_COOKIE_NAME] ?? req.body?.refreshToken;
            if (incoming) {
                await this.authService.logout(incoming);
            }
            res.clearCookie(REFRESH_COOKIE_NAME, clearRefreshTokenOptions);
            res.success('Logged out successfully', {}, statusCode.OK);
        } catch (err) {
            next(err);
        }
    };

    me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.sub;
            const user = await this.authService.getMe(userId as string);
            res.success('User fetched successfully', { user }, statusCode.OK);
        } catch (err) {
            next(err);
        }
    };
}