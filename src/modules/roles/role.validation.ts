import { z } from 'zod';

export const organizationIdParamSchema = z.object({
    params: z.object({ id: z.string().uuid() }),
});

export const roleIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
        roleId: z.string().uuid(),
    }),
});

export const createRoleSchema = z.object({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({
        name: z.string().trim().min(2).max(50),
        permissionKeys: z.array(z.string()).optional(),
    }),
});

export const updateRoleSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
        roleId: z.string().uuid(),
    }),
    body: z.object({
        name: z.string().trim().min(2).max(50).optional(),
    }),
});

export const updateRolePermissionsSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
        roleId: z.string().uuid(),
    }),
    body: z.object({
        permissionKeys: z.array(z.string()).min(1),
    }),
});
