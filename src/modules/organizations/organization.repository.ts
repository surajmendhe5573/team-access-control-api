import prisma from '../../config/db.js';

import { SYSTEM_ROLES } from './organization.types.js';

export const organizationRepository = {
    findBySlug(slug: string) {
        return prisma.organization.findUnique({ where: { slug } });
    },

    findById(id: string) {
        return prisma.organization.findFirst({ where: { id, deletedAt: null } });
    },

    findMembership(userId: string, organizationId: string) {
        return prisma.organizationMember.findUnique({
            where: { userId_organizationId: { userId, organizationId } },
            include: { role: true },
        });
    },

    listForUser(userId: string) {
        return prisma.organization.findMany({
            where: {
                deletedAt: null,
                members: { some: { userId } },
            },
            orderBy: { createdAt: 'desc' },
        });
    },

    // Creates the organization, seeds the 5 system roles, and makes the
    // creator an OWNER member — all in a single transaction so a failure
    // partway through never leaves an org with no owner or missing roles.
    async createWithOwner(data: { name: string; slug: string; creatorUserId: string }) {
        return prisma.$transaction(async (tx) => {
            const organization = await tx.organization.create({
                data: { name: data.name, slug: data.slug },
            });

            const roles = await Promise.all(
                SYSTEM_ROLES.map((roleName) =>
                    tx.role.create({
                        data: {
                            organizationId: organization.id,
                            name: roleName,
                            isSystem: true,
                        },
                    }),
                ),
            );

            const ownerRole = roles.find((r) => r.name === 'OWNER')!;

            await tx.organizationMember.create({
                data: {
                    userId: data.creatorUserId,
                    organizationId: organization.id,
                    roleId: ownerRole.id,
                },
            });

            return organization;
        });
    },

    update(id: string, data: { name?: string; slug?: string }) {
        return prisma.organization.update({ where: { id }, data });
    },

    softDelete(id: string) {
        return prisma.organization.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    },

    countOwners(organizationId: string) {
        return prisma.organizationMember.count({
            where: {
                organizationId,
                role: { name: 'OWNER' },
            },
        });
    },
};
