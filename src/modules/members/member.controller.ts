import { NextFunction, Request, Response } from 'express';

import { statusCode } from '../../utils/statusCode.js';

import memberService from './member.service.js';

export default class MemberController {
    private memberService = memberService;

    list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user!.sub;
            const { params } = req.validated as { params: { id: string } };
            const members = await this.memberService.list(params.id, userId);
            res.success('Members fetched successfully', { members }, statusCode.OK);
        } catch (err) {
            next(err);
        }
    };

    getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user!.sub;
            const { params } = req.validated as { params: { id: string; memberId: string } };
            const member = await this.memberService.getById(params.id, params.memberId, userId);
            res.success('Member fetched successfully', { member }, statusCode.OK);
        } catch (err) {
            next(err);
        }
    };

    add = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user!.sub;
            const { params, body } = req.validated as {
                params: { id: string };
                body: { email: string; roleName: string };
            };
            const member = await this.memberService.add(params.id, userId, body);
            res.success('Member added successfully', { member }, statusCode.CREATED);
        } catch (err) {
            next(err);
        }
    };

    remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user!.sub;
            const { params } = req.validated as { params: { id: string; memberId: string } };
            await this.memberService.remove(params.id, params.memberId, userId);
            res.success('Member removed successfully', {}, statusCode.OK);
        } catch (err) {
            next(err);
        }
    };
}
