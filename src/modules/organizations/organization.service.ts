import prisma from '../../config/db.js';
import { generateSlug } from '../../utils/generateSlug.js';
import { statusCode } from '../../utils/statusCode.js';
import roleService from '../roles/role.service.js';

import { CreateOrganizationInput, OrgRole, UpdateOrganizationInput } from './organization.types.js';

class OrganizationService {
    async create(userId: string, data: CreateOrganizationInput) {
        const slug = generateSlug(data.name);

        const organization = await prisma.organization.create({
            data: { name: data.name, slug },
        });

        const roleIds = await roleService.seedDefaultRoles(organization.id);

        await prisma.membership.create({
            data: {
                organizationId: organization.id,
                userId,
                roleId: roleIds.OWNER,
            },
        });

        return organization;
    }

    async listForUser(userId: string) {
        const memberships = await prisma.membership.findMany({
            where: { userId },
            include: { organization: true, role: true },
        });

        return memberships.map((m) => ({
            ...m.organization,
            myRole: m.role.name,
        }));
    }

    async getById(organizationId: string, userId: string) {
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
        });

        if (!organization) {
            throw Object.assign(new Error('Organization not found'), {
                statusCode: statusCode.NOT_FOUND,
            });
        }

        const membership = await this.assertMembership(organizationId, userId);

        return { ...organization, myRole: membership.role.name };
    }

    async update(organizationId: string, userId: string, data: UpdateOrganizationInput) {
        const existing = await prisma.organization.findUnique({
            where: { id: organizationId },
        });

        if (!existing) {
            throw Object.assign(new Error('Organization not found'), {
                statusCode: statusCode.NOT_FOUND,
            });
        }

        const membership = await this.assertMembership(organizationId, userId);
        this.assertRole(membership.role.name, [OrgRole.OWNER, OrgRole.ADMIN]);

        const organization = await prisma.organization.update({
            where: { id: organizationId },
            data: { name: data.name },
        });

        return organization;
    }

    async remove(organizationId: string, userId: string): Promise<void> {
        const existing = await prisma.organization.findUnique({
            where: { id: organizationId },
        });

        if (!existing) {
            throw Object.assign(new Error('Organization not found'), {
                statusCode: statusCode.NOT_FOUND,
            });
        }

        const membership = await this.assertMembership(organizationId, userId);
        this.assertRole(membership.role.name, [OrgRole.OWNER]);

        await prisma.organization.delete({ where: { id: organizationId } });
    }

    // ---------- Internal guards ----------

    private async assertMembership(organizationId: string, userId: string) {
        const membership = await prisma.membership.findUnique({
            where: { organizationId_userId: { organizationId, userId } },
            include: { role: true },
        });

        if (!membership) {
            throw Object.assign(new Error('You are not a member of this organization'), {
                statusCode: statusCode.FORBIDDEN,
            });
        }

        return membership; // membership.role.name now available
    }

    private assertRole(currentRoleName: string, allowed: string[]): void {
        if (!allowed.includes(currentRoleName)) {
            throw Object.assign(new Error('You do not have permission to perform this action'), {
                statusCode: statusCode.FORBIDDEN,
            });
        }
    }
}

export default new OrganizationService();
