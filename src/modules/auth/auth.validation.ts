import { z } from 'zod';

export const signupSchema = z.object({
    body: z.object({
        email: z.string().trim().toLowerCase().email('Invalid email address'),
        password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .max(72, 'Password must be at most 72 characters'),
        name: z.string().trim().min(1).max(100).optional(),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().trim().toLowerCase().email('Invalid email address'),
        password: z.string().min(1, 'Password is required'),
    }),
});

export const refreshSchema = z.object({
    body: z
        .object({
            refreshToken: z.string().min(1, 'Refresh token is required').optional(),
        })
        .optional()
        .default({}),
});

export type SignupInput = z.infer<typeof signupSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];