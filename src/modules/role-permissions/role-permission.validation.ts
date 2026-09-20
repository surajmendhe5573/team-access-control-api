import { z } from 'zod';

export const roleIdParamsSchema = z.object({
    params: z.object({
        organizationId: z.string().uuid(),
        roleId: z.string().uuid(),
    }),
});

export const assignPermissionSchema = z.object({
    params: z.object({
        organizationId: z.string().uuid(),
        roleId: z.string().uuid(),
    }),
    body: z.object({
        permissionId: z.string().uuid(),
    }),
});

export const removePermissionSchema = z.object({
    params: z.object({
        organizationId: z.string().uuid(),
        roleId: z.string().uuid(),
        permissionId: z.string().uuid(),
    }),
});

export const replacePermissionsSchema = z.object({
    params: z.object({
        organizationId: z.string().uuid(),
        roleId: z.string().uuid(),
    }),
    body: z.object({
        permissionIds: z.array(z.string().uuid()),
    }),
});

export type AssignPermissionBody = z.infer<typeof assignPermissionSchema>['body'];
export type ReplacePermissionsBody = z.infer<typeof replacePermissionsSchema>['body'];
