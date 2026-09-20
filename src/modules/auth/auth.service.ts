import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';

import { config } from '../../config/env.js';

import { authRepository } from './auth.repository.js';
import type { AuthTokens, LoginInput, RegisterInput, SafeUser } from './auth.types.js';

class AppError extends Error {
    constructor(
        public code: string,
        public statusCode: number,
        message: string,
    ) {
        super(message);
    }
}

// ---- helpers ----

function hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function generateRawToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

function toSafeUser(user: { id: string; email: string; name: string; status: string }): SafeUser {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status,
    };
}

import type { SignOptions } from 'jsonwebtoken';

function signAccessToken(userId: string, email: string, sessionId: string): string {
    return jwt.sign({ sub: userId, email, sessionId }, config.jwt.accessSecret, {
        expiresIn: config.jwt.accessExpiresIn as SignOptions['expiresIn'],
    });
}

function verifyAccessToken(token: string): { id: string; email: string; sessionId: string } {
    const payload = jwt.verify(token, config.jwt.accessSecret) as {
        sub: string;
        email: string;
        sessionId: string;
    };
    return { id: payload.sub, email: payload.email, sessionId: payload.sessionId };
}

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days, matches .env default

async function issueSessionAndTokens(
    userId: string,
    email: string,
    meta: { device?: string; userAgent?: string; ip?: string },
): Promise<AuthTokens> {
    const rawRefreshToken = generateRawToken();
    const refreshTokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    const session = await authRepository.createSession({
        userId,
        refreshTokenHash,
        device: meta.device,
        userAgent: meta.userAgent,
        ip: meta.ip,
        expiresAt,
    });

    return {
        accessToken: signAccessToken(userId, email, session.id),
        // client stores this opaque token; sessionId is not exposed separately
        refreshToken: rawRefreshToken,
        expiresIn: 15 * 60, // seconds, matches JWT_ACCESS_EXPIRES_IN=15m
    };
}

// ---- service ----

const authService = {
    verifyAccessToken,

    async register(input: RegisterInput): Promise<{ userId: string; email: string }> {
        const existing = await authRepository.findUserByEmail(input.email);
        if (existing) {
            throw new AppError('CONFLICT', 409, 'An account with this email already exists');
        }

        const passwordHash = await argon2.hash(input.password);
        const user = await authRepository.createUser({
            email: input.email,
            passwordHash,
            name: input.name,
        });

        // create + "send" (log for now) email verification token
        const rawToken = generateRawToken();
        const tokenHash = hashToken(rawToken);
        await authRepository.createEmailVerificationToken({
            userId: user.id,
            tokenHash,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
        });

        // TODO: wire this into your AWS SES email service once that's built
        console.log(`[dev] Email verification token for ${user.email}: ${rawToken}`);

        return { userId: user.id, email: user.email };
    },

    async verifyEmail(rawToken: string): Promise<void> {
        const tokenHash = hashToken(rawToken);
        const record = await authRepository.findEmailVerificationTokenByHash(tokenHash);

        if (!record || record.usedAt || record.expiresAt < new Date()) {
            throw new AppError('INVALID_TOKEN', 400, 'Invalid or expired verification token');
        }

        await authRepository.markEmailVerified(record.userId);
        await authRepository.markEmailVerificationTokenUsed(record.id);
    },

    async login(
        input: LoginInput,
        meta: { userAgent?: string; ip?: string },
    ): Promise<{ tokens: AuthTokens; user: SafeUser }> {
        const user = await authRepository.findUserByEmail(input.email);
        if (!user) {
            throw new AppError('UNAUTHORIZED', 401, 'Invalid email or password');
        }

        const passwordValid = await argon2.verify(user.passwordHash, input.password);
        if (!passwordValid) {
            throw new AppError('UNAUTHORIZED', 401, 'Invalid email or password');
        }

        if (user.status === 'SUSPENDED') {
            throw new AppError('FORBIDDEN', 403, 'Account is suspended');
        }
        if (user.status === 'DELETED') {
            throw new AppError('FORBIDDEN', 403, 'Account no longer exists');
        }
        if (user.status === 'PENDING_VERIFICATION') {
            throw new AppError('FORBIDDEN', 403, 'Please verify your email before logging in');
        }

        const tokens = await issueSessionAndTokens(user.id, user.email, {
            device: input.device,
            userAgent: meta.userAgent,
            ip: meta.ip,
        });

        return { tokens, user: toSafeUser(user) };
    },

    async refresh(rawRefreshToken: string): Promise<AuthTokens> {
        const tokenHash = hashToken(rawRefreshToken);
        const session = await authRepository.findSessionByRefreshTokenHash(tokenHash);

        if (!session) {
            throw new AppError('INVALID_TOKEN', 401, 'Invalid refresh token');
        }

        if (session.revokedAt) {
            // reuse of a revoked/rotated token => treat as compromised, kill the whole chain
            await authRepository.revokeSessionChain(session.id);
            throw new AppError(
                'INVALID_TOKEN',
                401,
                'Refresh token reuse detected — all sessions revoked',
            );
        }

        if (session.expiresAt < new Date()) {
            throw new AppError('TOKEN_EXPIRED', 401, 'Refresh token expired');
        }

        const user = await authRepository.findUserById(session.userId);
        if (!user || user.status !== 'ACTIVE') {
            throw new AppError('UNAUTHORIZED', 401, 'Account is not active');
        }

        const rawNewRefreshToken = generateRawToken();
        const newRefreshTokenHash = hashToken(rawNewRefreshToken);
        const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

        const newSession = await authRepository.rotateSession(session.id, {
            newRefreshTokenHash,
            newExpiresAt,
        });

        return {
            accessToken: signAccessToken(user.id, user.email, newSession.id),
            refreshToken: rawNewRefreshToken,
            expiresIn: 15 * 60,
        };
    },

    async logout(rawRefreshToken: string): Promise<void> {
        const tokenHash = hashToken(rawRefreshToken);
        const session = await authRepository.findSessionByRefreshTokenHash(tokenHash);
        if (session && !session.revokedAt) {
            await authRepository.revokeSession(session.id);
        }
        // no error if already logged out / token unknown — logout is idempotent
    },

    async logoutAll(userId: string): Promise<void> {
        await authRepository.revokeAllSessionsForUser(userId);
    },

    async getMe(userId: string): Promise<SafeUser> {
        const user = await authRepository.findUserById(userId);
        if (!user) {
            throw new AppError('NOT_FOUND', 404, 'User not found');
        }
        return toSafeUser(user);
    },

    async changePassword(
        userId: string,
        currentPassword: string,
        newPassword: string,
    ): Promise<void> {
        const user = await authRepository.findUserById(userId);
        if (!user) {
            throw new AppError('NOT_FOUND', 404, 'User not found');
        }

        const valid = await argon2.verify(user.passwordHash, currentPassword);
        if (!valid) {
            throw new AppError('UNAUTHORIZED', 401, 'Current password is incorrect');
        }

        const newHash = await argon2.hash(newPassword);
        await authRepository.updatePasswordHash(userId, newHash);
        await authRepository.revokeAllSessionsForUser(userId);
    },

    async forgotPassword(email: string): Promise<void> {
        const user = await authRepository.findUserByEmail(email);
        // Always behave the same way regardless of whether the user exists,
        // to avoid leaking which emails are registered.
        if (!user) return;

        const rawToken = generateRawToken();
        const tokenHash = hashToken(rawToken);
        await authRepository.createPasswordResetToken({
            userId: user.id,
            tokenHash,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1h
        });

        // TODO: wire into AWS SES
        console.log(`[dev] Password reset token for ${user.email}: ${rawToken}`);
    },

    async resetPassword(rawToken: string, newPassword: string): Promise<void> {
        const tokenHash = hashToken(rawToken);
        const record = await authRepository.findPasswordResetTokenByHash(tokenHash);

        if (!record || record.usedAt || record.expiresAt < new Date()) {
            throw new AppError('INVALID_TOKEN', 400, 'Invalid or expired reset token');
        }

        const newHash = await argon2.hash(newPassword);
        await authRepository.updatePasswordHash(record.userId, newHash);
        await authRepository.markPasswordResetTokenUsed(record.id);
        await authRepository.revokeAllSessionsForUser(record.userId);
    },
};

export { AppError, authService };
export default authService;
