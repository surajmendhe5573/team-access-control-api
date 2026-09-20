import type { NextFunction, Request, Response } from 'express';

import { statusCode } from '../../utils/statusCode.js';

import { rolePermissionService } from './role-permission.service.js';
import type { AssignPermissionBody, ReplacePermissionsBody } from './role-permission.validation.js';

export const rolePermissionController = {
    async list(
        req: Request<{ organizationId: string; roleId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const { organizationId, roleId } = req.params;
            const result = await rolePermissionService.list(organizationId, roleId);
            res.success('OK', result, statusCode.OK);
        } catch (err) {
            next(err);
        }
    },

    async assign(
        req: Request<{ organizationId: string; roleId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const { organizationId, roleId } = req.params;
            const { permissionId } = req.body as AssignPermissionBody;
            const result = await rolePermissionService.assign(
                organizationId,
                roleId,
                permissionId,
                req.organizationMembership!,
            );
            res.success('Permission assigned successfully', result, statusCode.CREATED);
        } catch (err) {
            next(err);
        }
    },

    async remove(
        req: Request<{ organizationId: string; roleId: string; permissionId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const { organizationId, roleId, permissionId } = req.params;
            await rolePermissionService.remove(
                organizationId,
                roleId,
                permissionId,
                req.organizationMembership!,
            );
            res.success('Permission removed successfully', {}, statusCode.OK);
        } catch (err) {
            next(err);
        }
    },

    async replaceAll(
        req: Request<{ organizationId: string; roleId: string }>,
        res: Response,
        next: NextFunction,
    ) {
        try {
            const { organizationId, roleId } = req.params;
            const { permissionIds } = req.body as ReplacePermissionsBody;
            const result = await rolePermissionService.replaceAll(
                organizationId,
                roleId,
                permissionIds,
                req.organizationMembership!,
            );
            res.success('Role permissions replaced successfully', result, statusCode.OK);
        } catch (err) {
            next(err);
        }
    },
};
