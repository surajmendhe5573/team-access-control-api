import { permissionRepository } from './permission.repository.js';
import type { SafePermission } from './permission.types.js';

class AppError extends Error {
    constructor(
        public code: string,
        public statusCode: number,
        message: string,
    ) {
        super(message);
    }
}

export const permissionService = {
    async list(): Promise<SafePermission[]> {
        return permissionRepository.list();
    },

    async getById(id: string): Promise<SafePermission> {
        const permission = await permissionRepository.findById(id);
        if (!permission) {
            throw new AppError('NOT_FOUND', 404, 'Permission not found');
        }
        return permission;
    },
};

export { AppError };
