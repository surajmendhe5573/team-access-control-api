import { z } from 'zod';

const slugField = z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens');

export const createOrganizationSchema = z.object({
    body: z.object({
        name: z.string().min(2).max(100),
        slug: slugField.optional(),
    }),
});

export const updateOrganizationSchema = z.object({
    params: z.object({
        organizationId: z.string().uuid(),
    }),
    body: z.object({
        name: z.string().min(2).max(100).optional(),
        slug: slugField.optional(),
    }),
});

export const organizationIdParamSchema = z.object({
    params: z.object({
        organizationId: z.string().uuid(),
    }),
});

export type CreateOrganizationBody = z.infer<typeof createOrganizationSchema>['body'];
export type UpdateOrganizationBody = z.infer<typeof updateOrganizationSchema>['body'];
