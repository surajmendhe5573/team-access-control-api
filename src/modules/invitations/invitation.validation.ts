import { z } from 'zod';

export const createInvitationSchema = z.object({
    params: z.object({
        organizationId: z.string().uuid(),
    }),
    body: z.object({
        email: z.string().email(),
        roleId: z.string().uuid(),
    }),
});

export const listInvitationsSchema = z.object({
    params: z.object({
        organizationId: z.string().uuid(),
    }),
    query: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED']).optional(),
    }),
});

export const invitationParamsSchema = z.object({
    params: z.object({
        organizationId: z.string().uuid(),
        invitationId: z.string().uuid(),
    }),
});

export const invitationTokenSchema = z.object({
    params: z.object({
        token: z.string().min(16),
    }),
});

export type CreateInvitationBody = z.infer<typeof createInvitationSchema>['body'];
