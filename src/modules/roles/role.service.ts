import { roleRepository } from './role.repository.js';
import type { CreateRoleInput, SafeRole, UpdateRoleInput } from './role.types.js';

class AppError extends Error {
    constructor(
        public code: string,
        public statusCode: number,
        message: string,
    ) {
        super(message);
    }
}

// These are seeded automatically for every org — no custom role may reuse
// one of these names, and only the seeder may create rows with these names.
const SYSTEM_ROLE_NAMES = ['OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'];

function toSafeRole(role: {
    id: string;
    organizationId: string;
    name: string;
    isSystem: boolean;
    createdAt: Date;
    updatedAt: Date;
}): SafeRole {
    return {
        id: role.id,
        organizationId: role.organizationId,
        name: role.name,
        isSystem: role.isSystem,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
    };
}

export const roleService = {
    async list(organizationId: string): Promise<SafeRole[]> {
        const roles = await roleRepository.list(organizationId);
        return roles.map(toSafeRole);
    },

    async getById(organizationId: string, roleId: string): Promise<SafeRole> {
        const role = await roleRepository.findById(organizationId, roleId);
        if (!role) {
            throw new AppError('NOT_FOUND', 404, 'Role not found');
        }
        return toSafeRole(role);
    },

    async create(organizationId: string, input: CreateRoleInput): Promise<SafeRole> {
        const normalizedName = input.name.trim().toUpperCase();

        if (SYSTEM_ROLE_NAMES.includes(normalizedName)) {
            throw new AppError(
                'CONFLICT',
                409,
                `"${normalizedName}" is a reserved system role name`,
            );
        }

        const existing = await roleRepository.findByName(organizationId, input.name);
        if (existing) {
            throw new AppError('CONFLICT', 409, 'A role with this name already exists');
        }

        const role = await roleRepository.create({ organizationId, name: input.name });
        return toSafeRole(role);
    },

    async update(
        organizationId: string,
        roleId: string,
        input: UpdateRoleInput,
    ): Promise<SafeRole> {
        const role = await roleRepository.findById(organizationId, roleId);
        if (!role) {
            throw new AppError('NOT_FOUND', 404, 'Role not found');
        }
        if (role.isSystem) {
            throw new AppError('FORBIDDEN', 403, 'System roles cannot be renamed');
        }

        if (input.name) {
            const normalizedName = input.name.trim().toUpperCase();
            if (SYSTEM_ROLE_NAMES.includes(normalizedName)) {
                throw new AppError(
                    'CONFLICT',
                    409,
                    `"${normalizedName}" is a reserved system role name`,
                );
            }

            const existing = await roleRepository.findByName(organizationId, input.name);
            if (existing && existing.id !== roleId) {
                throw new AppError('CONFLICT', 409, 'A role with this name already exists');
            }
        }

        const updated = await roleRepository.update(roleId, input);
        return toSafeRole(updated);
    },

    async remove(organizationId: string, roleId: string): Promise<void> {
        const role = await roleRepository.findById(organizationId, roleId);
        if (!role) {
            throw new AppError('NOT_FOUND', 404, 'Role not found');
        }
        if (role.isSystem) {
            throw new AppError('FORBIDDEN', 403, 'System roles cannot be deleted');
        }

        const memberCount = await roleRepository.countMembersWithRole(roleId);
        if (memberCount > 0) {
            throw new AppError(
                'CONFLICT',
                409,
                'Cannot delete a role that is currently assigned to members',
            );
        }

        await roleRepository.delete(roleId);
    },
};

export { AppError };
