import type { NextFunction, Request, Response } from 'express';

import { statusCode } from '../../utils/statusCode.js';

import { invitationService } from './invitation.service.js';
import type { CreateInvitationBody } from './invitation.validation.js';

type InvitationStatusFilter = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';

export const invitationController = {
    async create(req: Request<{ organizationId: string }>, res: Response, next: NextFunction) {
        try {
            const { organizationId } = req.params;
            const body = req.body as CreateInvitationBody;
            const invitation = await invitationService.create(
                organizationId,
                body,
                req.organizationMembership!,
                { ip: req.ip, userAgent: req.headers['user-agent'] },
            );
            res.success('Invitation sent successfully', invitation, statusCode.CREATED);
        } catch (err) {
            next(err);
        }
    },

    async list(req: Request<{ organizationId: string }>, res: Response, next: NextFunction) {
        try {
            const { organizationId } = req.params;
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 20;
            const status = req.query.status as InvitationStatusFilter | undefined;

            const result = await invitationService.list(organizationId, page, limit, status);
            res.success('OK', result, statusCode.OK);
        } catch (err) {
            next(err);
        }
    },

    async getById(
        req: Request<{ organizationId: string; invitationId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const { organizationId, invitationId } = req.params;
            const invitation = await invitationService.getById(organizationId, invitationId);
            res.success('OK', invitation, statusCode.OK);
        } catch (err) {
            next(err);
        }
    },

    async cancel(
        req: Request<{ organizationId: string; invitationId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const { organizationId, invitationId } = req.params;
            await invitationService.cancel(
                organizationId,
                invitationId,
                req.organizationMembership!,
                { ip: req.ip, userAgent: req.headers['user-agent'] },
            );
            res.success('Invitation cancelled successfully', {}, statusCode.OK);
        } catch (err) {
            next(err);
        }
    },

    async resend(
        req: Request<{ organizationId: string; invitationId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const { organizationId, invitationId } = req.params;
            const invitation = await invitationService.resend(
                organizationId,
                invitationId,
                req.organizationMembership!,
            );
            res.success('Invitation resent successfully', invitation, statusCode.OK);
        } catch (err) {
            next(err);
        }
    },

    async accept(req: Request<{ token: string }>, res: Response, next: NextFunction) {
        try {
            const { token } = req.params;
            const member = await invitationService.accept(token, req.user!.id, req.user!.email, {
                ip: req.ip,
                userAgent: req.headers['user-agent'],
            });
            res.success('Invitation accepted successfully', member, statusCode.OK);
        } catch (err) {
            next(err);
        }
    },

    async reject(req: Request<{ token: string }>, res: Response, next: NextFunction) {
        try {
            const { token } = req.params;
            await invitationService.reject(token, req.user!.id, req.user!.email, {
                ip: req.ip,
                userAgent: req.headers['user-agent'],
            });
            res.success('Invitation rejected', {}, statusCode.OK);
        } catch (err) {
            next(err);
        }
    },
};
