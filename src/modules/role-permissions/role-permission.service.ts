import type { OrganizationMembershipContext } from '../../middlewares/authorization.js';

import { rolePermissionRepository } from './role-permission.repository.js';
import type { SafeRolePermissions } from './role-permission.types.js';
import { DANGEROUS_PERMISSIONS, OWNER_SAFETY_FLOOR } from './role-permission.types.js';

class AppError extends Error {
    constructor(
        public code: string,
        public statusCode: number,
        message: string,
    ) {
        super(message);
    }
}

function toSafeRolePermissions(
    roleId: string,
    roleName: string,
    rows: { permission: { id: string; key: string; description: string | null } }[],
): SafeRolePermissions {
    return {
        roleId,
        roleName,
        permissions: rows.map((r) => r.permission),
    };
}

export const rolePermissionService = {
    async list(organizationId: string, roleId: string): Promise<SafeRolePermissions> {
        const role = await rolePermissionRepository.findRole(organizationId, roleId);
        if (!role) {
            throw new AppError('NOT_FOUND', 404, 'Role not found');
        }
        const rows = await rolePermissionRepository.listForRole(roleId);
        return toSafeRolePermissions(roleId, role.name, rows);
    },

    async assign(
        organizationId: string,
        roleId: string,
        permissionId: string,
        actor: OrganizationMembershipContext,
    ): Promise<SafeRolePermissions> {
        const role = await rolePermissionRepository.findRole(organizationId, roleId);
        if (!role) {
            throw new AppError('NOT_FOUND', 404, 'Role not found');
        }

        const permission = await rolePermissionRepository.findPermissionById(permissionId);
        if (!permission) {
            throw new AppError('NOT_FOUND', 404, 'Permission not found');
        }

        if (role.name === 'OWNER' && actor.roleName !== 'OWNER') {
            throw new AppError(
                'FORBIDDEN',
                403,
                "Only an owner can modify the OWNER role's permissions",
            );
        }

        if (DANGEROUS_PERMISSIONS.includes(permission.key) && actor.roleName !== 'OWNER') {
            throw new AppError(
                'FORBIDDEN',
                403,
                `Only an owner can grant the "${permission.key}" permission`,
            );
        }

        const existing = await rolePermissionRepository.exists(roleId, permissionId);
        if (existing) {
            throw new AppError('CONFLICT', 409, 'This role already has that permission');
        }

        await rolePermissionRepository.assign(roleId, permissionId);
        const rows = await rolePermissionRepository.listForRole(roleId);
        return toSafeRolePermissions(roleId, role.name, rows);
    },

    async remove(
        organizationId: string,
        roleId: string,
        permissionId: string,
        actor: OrganizationMembershipContext,
    ): Promise<void> {
        const role = await rolePermissionRepository.findRole(organizationId, roleId);
        if (!role) {
            throw new AppError('NOT_FOUND', 404, 'Role not found');
        }

        const permission = await rolePermissionRepository.findPermissionById(permissionId);
        if (!permission) {
            throw new AppError('NOT_FOUND', 404, 'Permission not found');
        }

        if (role.name === 'OWNER') {
            if (actor.roleName !== 'OWNER') {
                throw new AppError(
                    'FORBIDDEN',
                    403,
                    "Only an owner can modify the OWNER role's permissions",
                );
            }
            if (OWNER_SAFETY_FLOOR.includes(permission.key)) {
                throw new AppError(
                    'CONFLICT',
                    409,
                    `"${permission.key}" cannot be removed from OWNER — every organization must retain a role with this permission`,
                );
            }
        }

        const existing = await rolePermissionRepository.exists(roleId, permissionId);
        if (!existing) {
            throw new AppError('NOT_FOUND', 404, 'This role does not have that permission');
        }

        await rolePermissionRepository.remove(roleId, permissionId);
    },

    async replaceAll(
        organizationId: string,
        roleId: string,
        permissionIds: string[],
        actor: OrganizationMembershipContext,
    ): Promise<SafeRolePermissions> {
        const role = await rolePermissionRepository.findRole(organizationId, roleId);
        if (!role) {
            throw new AppError('NOT_FOUND', 404, 'Role not found');
        }

        const permissions = await rolePermissionRepository.findPermissionsByIds(permissionIds);
        if (permissions.length !== permissionIds.length) {
            throw new AppError('NOT_FOUND', 404, 'One or more permission IDs are invalid');
        }
        const requestedKeys = permissions.map((p) => p.key);

        if (role.name === 'OWNER') {
            if (actor.roleName !== 'OWNER') {
                throw new AppError(
                    'FORBIDDEN',
                    403,
                    "Only an owner can modify the OWNER role's permissions",
                );
            }
            const missingFloor = OWNER_SAFETY_FLOOR.filter((key) => !requestedKeys.includes(key));
            if (missingFloor.length > 0) {
                throw new AppError(
                    'CONFLICT',
                    409,
                    `OWNER must always retain: ${missingFloor.join(', ')}`,
                );
            }
        }

        const grantingDangerous = requestedKeys.some((key) => DANGEROUS_PERMISSIONS.includes(key));
        if (grantingDangerous && actor.roleName !== 'OWNER') {
            throw new AppError(
                'FORBIDDEN',
                403,
                'Only an owner can grant dangerous permissions (organization.delete, roles.update, roles.delete, permissions.assign, members.remove)',
            );
        }

        const rows = await rolePermissionRepository.replaceAll(roleId, permissionIds);
        return toSafeRolePermissions(roleId, role.name, rows);
    },
};

export { AppError };
