import { z } from 'zod';

import { OrgRole } from '../organizations/organization.types.js';

const orgRoleValues = Object.values(OrgRole) as [string, ...string[]];

export const organizationIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid organization id'),
    }),
});

export const memberIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid organization id'),
        memberId: z.string().uuid('Invalid member id'),
    }),
});

export const addMemberSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid organization id'),
    }),
    body: z.object({
        email: z.string().trim().toLowerCase().email('Invalid email address'),
        role: z.enum(orgRoleValues).default(OrgRole.MEMBER),
    }),
});
