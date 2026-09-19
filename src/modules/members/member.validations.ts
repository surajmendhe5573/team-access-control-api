import { z } from 'zod';

export const memberParamsSchema = z.object({
    params: z.object({
        organizationId: z.string().uuid(),
        memberId: z.string().uuid(),
    }),
});

export const listMembersSchema = z.object({
    params: z.object({
        organizationId: z.string().uuid(),
    }),
    query: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
    }),
});

export const updateMemberRoleSchema = z.object({
    params: z.object({
        organizationId: z.string().uuid(),
        memberId: z.string().uuid(),
    }),
    body: z.object({
        roleId: z.string().uuid(),
    }),
});

export const organizationIdOnlySchema = z.object({
    params: z.object({
        organizationId: z.string().uuid(),
    }),
});

export type UpdateMemberRoleBody = z.infer<typeof updateMemberRoleSchema>['body'];
