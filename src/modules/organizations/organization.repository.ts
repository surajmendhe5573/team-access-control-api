import prisma from '../../config/db.js';
import { DEFAULT_ROLE_PERMISSIONS } from '../../config/permissions.catalog.js';

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

    // Creates the organization, seeds the 5 system roles, assigns each role
    // its default permission set from the catalog, and makes the creator an
    // OWNER member — all in a single transaction so a failure partway
    // through never leaves an org with no owner or missing roles/permissions.
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

            // fetch every permission referenced anywhere in the default map,
            // once, so we don't hit the DB per-role
            const allDefaultKeys = Array.from(
                new Set(Object.values(DEFAULT_ROLE_PERMISSIONS).flat()),
            );
            const permissionRecords = await tx.permission.findMany({
                where: { key: { in: allDefaultKeys } },
            });
            const permissionIdByKey = new Map(permissionRecords.map((p) => [p.key, p.id]));

            for (const role of roles) {
                const keys = DEFAULT_ROLE_PERMISSIONS[role.name] ?? [];
                const rolePermissionRows = keys
                    .map((key) => permissionIdByKey.get(key))
                    .filter((id): id is string => Boolean(id))
                    .map((permissionId) => ({ roleId: role.id, permissionId }));

                if (rolePermissionRows.length > 0) {
                    await tx.rolePermission.createMany({ data: rolePermissionRows });
                }
            }

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
