import { z } from 'zod';

export const createOrganizationSchema = z.object({
    body: z.object({
        name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    }),
});

export const updateOrganizationSchema = z.object({
    body: z.object({
        name: z.string().trim().min(2).max(100).optional(),
    }),
    params: z.object({
        id: z.string().uuid('Invalid organization id'),
    }),
});

export const organizationIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid organization id'),
    }),
});
