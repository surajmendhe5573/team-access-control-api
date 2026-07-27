import { NextFunction, Request, Response } from 'express';

import { statusCode } from '../../utils/statusCode.js';

import organizationService from './organization.service.js';

export default class OrganizationController {
    private organizationService = organizationService;

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user!.sub;
            const organization = await this.organizationService.create(userId, req.body);
            res.success('Organization created successfully', { organization }, statusCode.CREATED);
        } catch (err) {
            next(err);
        }
    };

    list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user!.sub;
            const organizations = await this.organizationService.listForUser(userId);
            res.success('Organizations fetched successfully', { organizations }, statusCode.OK);
        } catch (err) {
            next(err);
        }
    };

    getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user!.sub;
            const { id } = (req.validated as { params: { id: string } }).params;
            const organization = await this.organizationService.getById(id, userId);
            res.success('Organization fetched successfully', { organization }, statusCode.OK);
        } catch (err) {
            next(err);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user!.sub;
            const { id } = (req.validated as { params: { id: string } }).params;
            const organization = await this.organizationService.update(id, userId, req.body);
            res.success('Organization updated successfully', { organization }, statusCode.OK);
        } catch (err) {
            next(err);
        }
    };

    remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user!.sub;
            const { id } = (req.validated as { params: { id: string } }).params;
            await this.organizationService.remove(id, userId);
            res.success('Organization deleted successfully', {}, statusCode.OK);
        } catch (err) {
            next(err);
        }
    };
}
