import { z } from 'zod';

const roleNameField = z.string().min(2).max(50);

export const createRoleSchema = z.object({
    params: z.object({
        organizationId: z.string().uuid(),
    }),
    body: z.object({
        name: roleNameField,
    }),
});

export const updateRoleSchema = z.object({
    params: z.object({
        organizationId: z.string().uuid(),
        roleId: z.string().uuid(),
    }),
    body: z.object({
        name: roleNameField,
    }),
});

export const roleParamsSchema = z.object({
    params: z.object({
        organizationId: z.string().uuid(),
        roleId: z.string().uuid(),
    }),
});

export type CreateRoleBody = z.infer<typeof createRoleSchema>['body'];
export type UpdateRoleBody = z.infer<typeof updateRoleSchema>['body'];
