import { NextFunction, Request, Response } from 'express';

import authService from '../modules/auth/auth.service.js';
import { statusCode } from '../utils/statusCode.js';

export default function authenticate(req: Request, res: Response, next: NextFunction): void {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
        res.fail('Authentication required', statusCode.UNAUTHORIZED);
        return;
    }

    const token = header.slice('Bearer '.length);

    try {
        const payload = authService.verifyAccessToken(token);
        req.user = payload;
        next();
    } catch {
        res.fail('Invalid or expired access token', statusCode.UNAUTHORIZED);
    }
}
