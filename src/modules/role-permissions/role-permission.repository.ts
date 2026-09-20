import prisma from '../../config/db.js';

export const rolePermissionRepository = {
    findRole(organizationId: string, roleId: string) {
        return prisma.role.findFirst({ where: { id: roleId, organizationId } });
    },

    findPermissionById(permissionId: string) {
        return prisma.permission.findUnique({ where: { id: permissionId } });
    },

    findPermissionsByIds(permissionIds: string[]) {
        return prisma.permission.findMany({ where: { id: { in: permissionIds } } });
    },

    listForRole(roleId: string) {
        return prisma.rolePermission.findMany({
            where: { roleId },
            include: { permission: true },
        });
    },

    exists(roleId: string, permissionId: string) {
        return prisma.rolePermission.findUnique({
            where: { roleId_permissionId: { roleId, permissionId } },
        });
    },

    assign(roleId: string, permissionId: string) {
        return prisma.rolePermission.create({ data: { roleId, permissionId } });
    },

    remove(roleId: string, permissionId: string) {
        return prisma.rolePermission.delete({
            where: { roleId_permissionId: { roleId, permissionId } },
        });
    },

    // Deletes everything currently assigned and inserts the new set in one
    // transaction, so a client can send "here's the full checked list" and
    // never has to diff it themselves.
    replaceAll(roleId: string, permissionIds: string[]) {
        return prisma.$transaction(async (tx) => {
            await tx.rolePermission.deleteMany({ where: { roleId } });
            if (permissionIds.length > 0) {
                await tx.rolePermission.createMany({
                    data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
                });
            }
            return tx.rolePermission.findMany({
                where: { roleId },
                include: { permission: true },
            });
        });
    },
};
