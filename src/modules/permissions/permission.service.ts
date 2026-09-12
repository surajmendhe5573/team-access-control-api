import { Permission } from '@prisma/client';

import prisma from '../../config/db.js';
import { statusCode } from '../../utils/statusCode.js';

import { CreatePermissionInput } from './permission.types.js';

class PermissionService {
    async list(): Promise<Permission[]> {
        return await prisma.permission.findMany({ orderBy: { key: 'asc' } });
    }

    async create(data: CreatePermissionInput): Promise<Permission> {
        const existing = await prisma.permission.findUnique({ where: { key: data.key } });
        if (existing) {
            throw Object.assign(new Error('Permission with this key already exists'), {
                statusCode: statusCode.CONFLICT,
            });
        }

        return await prisma.permission.create({ data });
    }
}

export default new PermissionService();
