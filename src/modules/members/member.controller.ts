import type { NextFunction, Request, Response } from 'express';

import { statusCode } from '../../utils/statusCode.js';

import { memberService } from './member.service.js';
import type { UpdateMemberRoleBody } from './member.validations.js';

export const memberController = {
    async list(req: Request<{ organizationId: string }>, res: Response, next: NextFunction) {
        try {
            const { organizationId } = req.params;
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 20;
            const result = await memberService.list(organizationId, page, limit);
            res.success('OK', result, statusCode.OK);
        } catch (err) {
            next(err);
        }
    },

    async getById(
        req: Request<{ organizationId: string; memberId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const { organizationId, memberId } = req.params;
            const member = await memberService.getById(organizationId, memberId);
            res.success('OK', member, statusCode.OK);
        } catch (err) {
            next(err);
        }
    },

    async updateRole(
        req: Request<{ organizationId: string; memberId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const { organizationId, memberId } = req.params;
            const { roleId } = req.body as UpdateMemberRoleBody;
            const member = await memberService.updateRole(
                organizationId,
                memberId,
                roleId,
                req.organizationMembership!,
                { ip: req.ip, userAgent: req.headers['user-agent'] },
            );
            res.success('Member role updated successfully', member, statusCode.OK);
        } catch (err) {
            next(err);
        }
    },

    async remove(
        req: Request<{ organizationId: string; memberId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const { organizationId, memberId } = req.params;
            await memberService.remove(organizationId, memberId, req.organizationMembership!, {
                ip: req.ip,
                userAgent: req.headers['user-agent'],
            });
            res.success('Member removed successfully', {}, statusCode.OK);
        } catch (err) {
            next(err);
        }
    },

    async leave(req: Request<{ organizationId: string }>, res: Response, next: NextFunction) {
        try {
            const { organizationId } = req.params;
            await memberService.leave(organizationId, req.organizationMembership!, {
                ip: req.ip,
                userAgent: req.headers['user-agent'],
            });
            res.success('Left organization successfully', {}, statusCode.OK);
        } catch (err) {
            next(err);
        }
    },
};
