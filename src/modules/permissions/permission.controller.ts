import type { NextFunction, Request, Response } from 'express';

import { statusCode } from '../../utils/statusCode.js';

import { permissionService } from './permission.service.js';

export const permissionController = {
    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const permissions = await permissionService.list();
            res.success('OK', permissions, statusCode.OK);
        } catch (err) {
            next(err);
        }
    },

    async getById(req: Request<{ permissionId: string }>, res: Response, next: NextFunction) {
        try {
            const { permissionId } = req.params;
            const permission = await permissionService.getById(permissionId);
            res.success('OK', permission, statusCode.OK);
        } catch (err) {
            next(err);
        }
    },
};
