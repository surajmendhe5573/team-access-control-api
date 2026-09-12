import { NextFunction, Request, Response } from 'express';

import { statusCode } from '../../utils/statusCode.js';

import roleService from './role.service.js';

export default class RoleController {
    private roleService = roleService;

    list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { params } = req.validated as { params: { id: string } };
            const roles = await this.roleService.list(params.id);
            res.success('Roles fetched successfully', { roles }, statusCode.OK);
        } catch (err) {
            next(err);
        }
    };

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { params, body } = req.validated as {
                params: { id: string };
                body: { name: string; permissionKeys?: string[] };
            };
            const role = await this.roleService.create(params.id, body);
            res.success('Role created successfully', { role }, statusCode.CREATED);
        } catch (err) {
            next(err);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { params, body } = req.validated as {
                params: { id: string; roleId: string };
                body: { name?: string };
            };
            const role = await this.roleService.update(params.id, params.roleId, body);
            res.success('Role updated successfully', { role }, statusCode.OK);
        } catch (err) {
            next(err);
        }
    };

    updatePermissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { params, body } = req.validated as {
                params: { id: string; roleId: string };
                body: { permissionKeys: string[] };
            };
            const role = await this.roleService.updatePermissions(params.id, params.roleId, body);
            res.success('Role permissions updated successfully', { role }, statusCode.OK);
        } catch (err) {
            next(err);
        }
    };

    remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { params } = req.validated as { params: { id: string; roleId: string } };
            await this.roleService.remove(params.id, params.roleId);
            res.success('Role deleted successfully', {}, statusCode.OK);
        } catch (err) {
            next(err);
        }
    };
}
