import prisma from '../../config/db.js';

export const permissionRepository = {
    list() {
        return prisma.permission.findMany({ orderBy: { key: 'asc' } });
    },

    findById(id: string) {
        return prisma.permission.findUnique({ where: { id } });
    },
};
