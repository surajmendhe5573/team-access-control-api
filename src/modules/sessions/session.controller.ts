import type { NextFunction, Request, Response } from 'express';

import { statusCode } from '../../utils/statusCode.js';

import { sessionService } from './session.service.js';

export const sessionController = {
    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const sessions = await sessionService.list(req.user!.id, req.user!.sessionId);
            res.success('OK', sessions, statusCode.OK);
        } catch (err) {
            next(err);
        }
    },

    async getById(req: Request<{ sessionId: string }>, res: Response, next: NextFunction) {
        try {
            const { sessionId } = req.params;
            const session = await sessionService.getById(
                req.user!.id,
                sessionId,
                req.user!.sessionId,
            );
            res.success('OK', session, statusCode.OK);
        } catch (err) {
            next(err);
        }
    },

    async revokeOne(req: Request<{ sessionId: string }>, res: Response, next: NextFunction) {
        try {
            const { sessionId } = req.params;
            await sessionService.revokeOne(req.user!.id, sessionId);
            res.success('Session revoked successfully', {}, statusCode.OK);
        } catch (err) {
            next(err);
        }
    },

    async revokeOthers(req: Request, res: Response, next: NextFunction) {
        try {
            await sessionService.revokeOthers(req.user!.id, req.user!.sessionId);
            res.success('All other sessions revoked successfully', {}, statusCode.OK);
        } catch (err) {
            next(err);
        }
    },

    async revokeAll(req: Request, res: Response, next: NextFunction) {
        try {
            await sessionService.revokeAll(req.user!.id);
            res.success('All sessions revoked successfully', {}, statusCode.OK);
        } catch (err) {
            next(err);
        }
    },
};
