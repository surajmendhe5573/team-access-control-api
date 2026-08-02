import prisma from '../../config/db.js';
import { statusCode } from '../../utils/statusCode.js';
import { OrgRole } from '../organizations/organization.types.js';

import { AddMemberInput } from './member.types.js';

class MemberService {
    async list(organizationId: string, requestingUserId: string) {
        await this.assertMembership(organizationId, requestingUserId);

        const members = await prisma.membership.findMany({
            where: { organizationId },
            include: {
                user: {
                    select: { id: true, email: true, name: true },
                },
            },
            orderBy: { joinedAt: 'asc' },
        });

        return members;
    }

    async getById(organizationId: string, memberId: string, requestingUserId: string) {
        await this.assertMembership(organizationId, requestingUserId);

        const member = await prisma.membership.findUnique({
            where: { id: memberId },
            include: {
                user: {
                    select: { id: true, email: true, name: true },
                },
            },
        });

        if (!member || member.organizationId !== organizationId) {
            throw Object.assign(new Error('Member not found'), {
                statusCode: statusCode.NOT_FOUND,
            });
        }

        return member;
    }

    async add(organizationId: string, requestingUserId: string, data: AddMemberInput) {
        const requesterMembership = await this.assertMembership(organizationId, requestingUserId);
        this.assertRole(requesterMembership.role, [OrgRole.OWNER, OrgRole.ADMIN]);

        const targetUser = await prisma.user.findUnique({ where: { email: data.email } });
        if (!targetUser) {
            throw Object.assign(new Error('No user found with that email'), {
                statusCode: statusCode.NOT_FOUND,
            });
        }

        const existing = await prisma.membership.findUnique({
            where: {
                organizationId_userId: { organizationId, userId: targetUser.id },
            },
        });
        if (existing) {
            throw Object.assign(new Error('User is already a member of this organization'), {
                statusCode: statusCode.CONFLICT,
            });
        }

        const membership = await prisma.membership.create({
            data: {
                organizationId,
                userId: targetUser.id,
                role: data.role,
            },
            include: {
                user: {
                    select: { id: true, email: true, name: true },
                },
            },
        });

        return membership;
    }

    async remove(
        organizationId: string,
        memberId: string,
        requestingUserId: string,
    ): Promise<void> {
        const requesterMembership = await this.assertMembership(organizationId, requestingUserId);
        this.assertRole(requesterMembership.role, [OrgRole.OWNER, OrgRole.ADMIN]);

        const target = await prisma.membership.findUnique({ where: { id: memberId } });
        if (!target || target.organizationId !== organizationId) {
            throw Object.assign(new Error('Member not found'), {
                statusCode: statusCode.NOT_FOUND,
            });
        }

        if (target.role === OrgRole.OWNER) {
            const ownerCount = await prisma.membership.count({
                where: { organizationId, role: OrgRole.OWNER },
            });
            if (ownerCount <= 1) {
                throw Object.assign(new Error('Cannot remove the last owner of an organization'), {
                    statusCode: statusCode.CONFLICT,
                });
            }
        }

        await prisma.membership.delete({ where: { id: memberId } });
    }

    // ---------- Internal guards ----------

    private async assertMembership(organizationId: string, userId: string) {
        const membership = await prisma.membership.findUnique({
            where: { organizationId_userId: { organizationId, userId } },
        });

        if (!membership) {
            throw Object.assign(new Error('You are not a member of this organization'), {
                statusCode: statusCode.FORBIDDEN,
            });
        }

        return membership;
    }

    private assertRole(currentRole: string, allowed: string[]): void {
        if (!allowed.includes(currentRole)) {
            throw Object.assign(new Error('You do not have permission to perform this action'), {
                statusCode: statusCode.FORBIDDEN,
            });
        }
    }
}

export default new MemberService();
