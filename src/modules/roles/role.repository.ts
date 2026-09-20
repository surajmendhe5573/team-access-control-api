import prisma from '../../config/db.js';

export const roleRepository = {
    list(organizationId: string) {
        return prisma.role.findMany({
            where: { organizationId },
            orderBy: { createdAt: 'asc' },
        });
    },

    findById(organizationId: string, roleId: string) {
        return prisma.role.findFirst({ where: { id: roleId, organizationId } });
    },

    findByName(organizationId: string, name: string) {
        return prisma.role.findFirst({ where: { organizationId, name } });
    },

    create(data: { organizationId: string; name: string }) {
        return prisma.role.create({
            data: { organizationId: data.organizationId, name: data.name, isSystem: false },
        });
    },

    update(roleId: string, data: { name?: string }) {
        return prisma.role.update({ where: { id: roleId }, data });
    },

    delete(roleId: string) {
        return prisma.role.delete({ where: { id: roleId } });
    },

    countMembersWithRole(roleId: string) {
        return prisma.organizationMember.count({ where: { roleId } });
    },
};
