import { Permission, Role } from '@prisma/client';

import prisma from '../../config/db.js';
import { statusCode } from '../../utils/statusCode.js';
import { DEFAULT_ROLE_PERMISSIONS } from '../permissions/permission.constants.js';

import { CreateRoleInput, UpdateRoleInput, UpdateRolePermissionsInput } from './role.types.js';

interface RoleWithPermissions extends Role {
    rolePermissions: Array<{
        id: string;
        roleId: string;
        permissionId: string;
        permission: Permission;
    }>;
}

class RoleService {
    // Called internally by OrganizationService.create — not its own HTTP endpoint
    async seedDefaultRoles(
        organizationId: string,
    ): Promise<{ OWNER: string; ADMIN: string; MEMBER: string; VIEWER: string }> {
        const roleNames = Object.keys(DEFAULT_ROLE_PERMISSIONS);
        const createdRoles: Record<string, string> = {};

        for (const name of roleNames) {
            const permissionKeys = DEFAULT_ROLE_PERMISSIONS[name];
            const permissions = await prisma.permission.findMany({
                where: { key: { in: permissionKeys } },
            });

            const role = await prisma.role.create({
                data: {
                    organizationId,
                    name,
                    isSystem: true,
                    rolePermissions: {
                        create: permissions.map((p) => ({ permissionId: p.id })),
                    },
                },
            });

            createdRoles[name] = role.id;
        }

        return createdRoles as { OWNER: string; ADMIN: string; MEMBER: string; VIEWER: string };
    }

    async list(organizationId: string): Promise<RoleWithPermissions[]> {
        return await prisma.role.findMany({
            where: { organizationId },
            include: { rolePermissions: { include: { permission: true } } },
            orderBy: { createdAt: 'asc' },
        });
    }

    async create(organizationId: string, data: CreateRoleInput): Promise<RoleWithPermissions> {
        const permissions = data.permissionKeys?.length
            ? await prisma.permission.findMany({ where: { key: { in: data.permissionKeys } } })
            : [];

        return await prisma.role.create({
            data: {
                organizationId,
                name: data.name,
                rolePermissions: { create: permissions.map((p) => ({ permissionId: p.id })) },
            },
            include: { rolePermissions: { include: { permission: true } } },
        });
    }

    async update(
        organizationId: string,
        roleId: string,
        data: UpdateRoleInput,
    ): Promise<RoleWithPermissions> {
        const role = await this.assertRoleInOrg(organizationId, roleId);

        if (role.isSystem && data.name) {
            throw Object.assign(new Error('Cannot rename a default system role'), {
                statusCode: statusCode.FORBIDDEN,
            });
        }

        return await prisma.role.update({
            where: { id: roleId },
            data: data.name ? { name: data.name } : {},
            include: { rolePermissions: { include: { permission: true } } },
        });
    }

    async updatePermissions(
        organizationId: string,
        roleId: string,
        data: UpdateRolePermissionsInput,
    ): Promise<RoleWithPermissions | null> {
        await this.assertRoleInOrg(organizationId, roleId);

        const permissions = await prisma.permission.findMany({
            where: { key: { in: data.permissionKeys } },
        });

        await prisma.rolePermission.deleteMany({ where: { roleId } });
        await prisma.rolePermission.createMany({
            data: permissions.map((p) => ({ roleId, permissionId: p.id })),
        });

        return await prisma.role.findUnique({
            where: { id: roleId },
            include: { rolePermissions: { include: { permission: true } } },
        });
    }

    async remove(organizationId: string, roleId: string): Promise<void> {
        const role = await this.assertRoleInOrg(organizationId, roleId);

        if (role.isSystem) {
            throw Object.assign(new Error('Cannot delete a default system role'), {
                statusCode: statusCode.FORBIDDEN,
            });
        }

        const inUse = await prisma.membership.count({ where: { roleId } });
        if (inUse > 0) {
            throw Object.assign(new Error('Cannot delete a role currently assigned to members'), {
                statusCode: statusCode.CONFLICT,
            });
        }

        await prisma.role.delete({ where: { id: roleId } });
    }

    private async assertRoleInOrg(organizationId: string, roleId: string): Promise<Role> {
        const role = await prisma.role.findUnique({ where: { id: roleId } });
        if (!role || role.organizationId !== organizationId) {
            throw Object.assign(new Error('Role not found'), {
                statusCode: statusCode.NOT_FOUND,
            });
        }
        return role;
    }
}

export default new RoleService();
