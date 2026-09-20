import type { NextFunction, Request, Response } from 'express';

import { statusCode } from '../../utils/statusCode.js';

import { roleService } from './role.service.js';
import type { CreateRoleBody, UpdateRoleBody } from './role.validation.js';

export const roleController = {
    async list(req: Request<{ organizationId: string }>, res: Response, next: NextFunction) {
        try {
            const { organizationId } = req.params;
            const roles = await roleService.list(organizationId);
            res.success('OK', roles, statusCode.OK);
        } catch (err) {
            next(err);
        }
    },

    async getById(
        req: Request<{ organizationId: string; roleId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const { organizationId, roleId } = req.params;
            const role = await roleService.getById(organizationId, roleId);
            res.success('OK', role, statusCode.OK);
        } catch (err) {
            next(err);
        }
    },

    async create(req: Request<{ organizationId: string }>, res: Response, next: NextFunction) {
        try {
            const { organizationId } = req.params;
            const body = req.body as CreateRoleBody;
            const role = await roleService.create(organizationId, body);
            res.success('Role created successfully', role, statusCode.CREATED);
        } catch (err) {
            next(err);
        }
    },

    async update(
        req: Request<{ organizationId: string; roleId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const { organizationId, roleId } = req.params;
            const body = req.body as UpdateRoleBody;
            const role = await roleService.update(organizationId, roleId, body);
            res.success('Role updated successfully', role, statusCode.OK);
        } catch (err) {
            next(err);
        }
    },

    async remove(
        req: Request<{ organizationId: string; roleId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const { organizationId, roleId } = req.params;
            await roleService.remove(organizationId, roleId);
            res.success('Role deleted successfully', {}, statusCode.OK);
        } catch (err) {
            next(err);
        }
    },
};
