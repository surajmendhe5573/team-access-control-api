import { generateSlug } from '../../utils/generateSlug.js';

import { organizationRepository } from './organization.repository.js';
import type {
    CreateOrganizationInput,
    SafeOrganization,
    UpdateOrganizationInput,
} from './organization.types.js';

class AppError extends Error {
    constructor(
        public code: string,
        public statusCode: number,
        message: string,
    ) {
        super(message);
    }
}

function toSafeOrganization(org: {
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
}): SafeOrganization {
    return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
    };
}

// NOTE: membership + role checks below are inline for now. Once the shared
// authorization middleware chain (loadOrganizationContext + requirePermission)
// is built, these checks should move there instead of living in each service.
export const organizationService = {
    async create(input: CreateOrganizationInput, creatorUserId: string): Promise<SafeOrganization> {
        const slug = input.slug ?? generateSlug(input.name);

        const existing = await organizationRepository.findBySlug(slug);
        if (existing) {
            throw new AppError('CONFLICT', 409, 'An organization with this slug already exists');
        }

        const org = await organizationRepository.createWithOwner({
            name: input.name,
            slug,
            creatorUserId,
        });

        return toSafeOrganization(org);
    },

    async listMine(userId: string): Promise<SafeOrganization[]> {
        const orgs = await organizationRepository.listForUser(userId);
        return orgs.map(toSafeOrganization);
    },

    async getById(organizationId: string, userId: string): Promise<SafeOrganization> {
        const membership = await organizationRepository.findMembership(userId, organizationId);
        if (!membership) {
            throw new AppError('FORBIDDEN', 403, 'You do not have access to this organization');
        }

        const org = await organizationRepository.findById(organizationId);
        if (!org) {
            throw new AppError('NOT_FOUND', 404, 'Organization not found');
        }

        return toSafeOrganization(org);
    },

    async update(
        organizationId: string,
        userId: string,
        input: UpdateOrganizationInput,
    ): Promise<SafeOrganization> {
        const membership = await organizationRepository.findMembership(userId, organizationId);
        if (!membership) {
            throw new AppError('FORBIDDEN', 403, 'You do not have access to this organization');
        }
        if (!['OWNER', 'ADMIN'].includes(membership.role.name)) {
            throw new AppError(
                'FORBIDDEN',
                403,
                'Only owners or admins can update the organization',
            );
        }

        if (input.slug) {
            const existing = await organizationRepository.findBySlug(input.slug);
            if (existing && existing.id !== organizationId) {
                throw new AppError(
                    'CONFLICT',
                    409,
                    'An organization with this slug already exists',
                );
            }
        }

        const org = await organizationRepository.findById(organizationId);
        if (!org) {
            throw new AppError('NOT_FOUND', 404, 'Organization not found');
        }

        const updated = await organizationRepository.update(organizationId, input);
        return toSafeOrganization(updated);
    },

    async remove(organizationId: string, userId: string): Promise<void> {
        const membership = await organizationRepository.findMembership(userId, organizationId);
        if (!membership) {
            throw new AppError('FORBIDDEN', 403, 'You do not have access to this organization');
        }
        if (membership.role.name !== 'OWNER') {
            throw new AppError('FORBIDDEN', 403, 'Only an owner can delete the organization');
        }

        const org = await organizationRepository.findById(organizationId);
        if (!org) {
            throw new AppError('NOT_FOUND', 404, 'Organization not found');
        }

        await organizationRepository.softDelete(organizationId);
    },
};

export { AppError };
