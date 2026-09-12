import { z } from 'zod';

export const createPermissionSchema = z.object({
    body: z.object({
        key: z
            .string()
            .trim()
            .toLowerCase()
            .regex(/^[a-z]+\.[a-z]+$/, 'Key must follow "resource.action" format, e.g. users.read'),
        description: z.string().trim().max(200).optional(),
    }),
});
