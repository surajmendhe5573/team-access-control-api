import type { NextFunction, Request, Response } from 'express';

import prisma from '../config/db.js';
import { statusCode } from '../utils/statusCode.js';

export interface OrganizationMembershipContext {
    id: string;
    organizationId: string;
    userId: string;
    roleId: string;
    roleName: string;
    permissions: string[];
}

// Verifies the caller belongs to :organizationId and attaches their
// membership + resolved permission set to req.organizationMembership.
// Must run after `authenticate` and before `requirePermission`.
export async function loadOrganizationContext(
    req: Request<{ organizationId: string }>,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const organizationId = req.params.organizationId;

    if (!organizationId) {
        res.fail('organizationId is required', statusCode.BAD_REQUEST);
        return;
    }

    const organization = await prisma.organization.findFirst({
        where: { id: organizationId, deletedAt: null },
    });

    if (!organization) {
        res.fail('Organization not found', statusCode.NOT_FOUND);
        return;
    }

    const membership = await prisma.organizationMember.findUnique({
        where: {
            userId_organizationId: {
                userId: req.user!.id,
                organizationId,
            },
        },
        include: {
            role: {
                include: {
                    permissions: {
                        include: { permission: true },
                    },
                },
            },
        },
    });

    if (!membership) {
        res.fail('You do not have access to this organization', statusCode.FORBIDDEN);
        return;
    }

    req.organizationMembership = {
        id: membership.id,
        organizationId: membership.organizationId,
        userId: membership.userId,
        roleId: membership.roleId,
        roleName: membership.role.name,
        permissions: membership.role.permissions.map((rp) => rp.permission.key),
    };

    next();
}

// Checks that the caller's resolved permission set (from loadOrganizationContext)
// includes the given permission key. Must run after loadOrganizationContext.
export function requirePermission(permissionKey: string) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const membership = req.organizationMembership;

        if (!membership) {
            res.fail(
                'Organization context missing — check middleware order',
                statusCode.INTERNAL_SERVER_ERROR,
            );
            return;
        }

        if (!membership.permissions.includes(permissionKey)) {
            res.fail('You do not have permission to perform this action', statusCode.FORBIDDEN);
            return;
        }

        next();
    };
}
