import { NextFunction, Request, Response } from 'express';

import { statusCode } from '../../utils/statusCode.js';

import permissionService from './permission.service.js';

export default class PermissionController {
    private permissionService = permissionService;

    list = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const permissions = await this.permissionService.list();
            res.success('Permissions fetched successfully', { permissions }, statusCode.OK);
        } catch (err) {
            next(err);
        }
    };

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { body } = req.validated as { body: { key: string; description?: string } };
            const permission = await this.permissionService.create(body);
            res.success('Permission created successfully', { permission }, statusCode.CREATED);
        } catch (err) {
            next(err);
        }
    };
}
