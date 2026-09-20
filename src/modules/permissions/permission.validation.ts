import { z } from 'zod';

export const permissionIdParamSchema = z.object({
    params: z.object({
        permissionId: z.string().uuid(),
    }),
});
