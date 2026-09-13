import { z } from 'zod';

export const registerSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        name: z.string().min(2).max(100),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(1),
        device: z.string().optional(),
    }),
});

export const refreshSchema = z.object({
    body: z.object({
        refreshToken: z.string().min(1),
    }),
});

export const verifyEmailSchema = z.object({
    body: z.object({
        token: z.string().min(1),
    }),
});

export const forgotPasswordSchema = z.object({
    body: z.object({
        email: z.string().email(),
    }),
});

export const resetPasswordSchema = z.object({
    body: z.object({
        token: z.string().min(1),
        newPassword: z.string().min(8),
    }),
});

export const changePasswordSchema = z.object({
    body: z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8),
    }),
});

export type RegisterBody = z.infer<typeof registerSchema>['body'];
export type LoginBody = z.infer<typeof loginSchema>['body'];
export type RefreshBody = z.infer<typeof refreshSchema>['body'];
export type ResetPasswordBody = z.infer<typeof resetPasswordSchema>['body'];
export type ChangePasswordBody = z.infer<typeof changePasswordSchema>['body'];
