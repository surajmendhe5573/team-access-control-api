import type { NextFunction, Request, Response } from 'express';

import { statusCode } from '../../utils/statusCode.js';

import { organizationService } from './organization.service.js';
import type { CreateOrganizationBody, UpdateOrganizationBody } from './organization.validation.js';

export const organizationController = {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const body = req.body as CreateOrganizationBody;
            const org = await organizationService.create(body, req.user!.id);
            res.success('Organization created successfully', org, statusCode.CREATED);
        } catch (err) {
            next(err);
        }
    },

    async listMine(req: Request, res: Response, next: NextFunction) {
        try {
            const orgs = await organizationService.listMine(req.user!.id);
            res.success('OK', orgs, statusCode.OK);
        } catch (err) {
            next(err);
        }
    },

    async getById(req: Request<{ organizationId: string }>, res: Response, next: NextFunction) {
        try {
            const { organizationId } = req.params;
            const org = await organizationService.getById(organizationId, req.user!.id);
            res.success('OK', org, statusCode.OK);
        } catch (err) {
            next(err);
        }
    },

    async update(req: Request<{ organizationId: string }>, res: Response, next: NextFunction) {
        try {
            const { organizationId } = req.params;
            const body = req.body as UpdateOrganizationBody;
            const org = await organizationService.update(organizationId, req.user!.id, body);
            res.success('Organization updated successfully', org, statusCode.OK);
        } catch (err) {
            next(err);
        }
    },

    async remove(req: Request<{ organizationId: string }>, res: Response, next: NextFunction) {
        try {
            const { organizationId } = req.params;
            await organizationService.remove(organizationId, req.user!.id);
            res.success('Organization deleted successfully', {}, statusCode.OK);
        } catch (err) {
            next(err);
        }
    },
};
