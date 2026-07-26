import crypto from 'node:crypto';

import argon2 from 'argon2';
import jwt, { SignOptions } from 'jsonwebtoken';

import prisma from '../../config/db.js';
import { statusCode } from '../../utils/statusCode.js';
import { JwtPayload, LoginInput, SignupInput, TokenPair } from './auth.types.js';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as string;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;
const ACCESS_EXPIRES_IN = (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as SignOptions['expiresIn'];
const REFRESH_EXPIRES_IN_DAYS = 7;

if (!ACCESS_SECRET || !REFRESH_SECRET) {
    throw new Error('JWT secrets are not set in environment variables');
}

class AuthService {
    // Password hashing
    private async hashPassword(plain: string): Promise<string> {
        return argon2.hash(plain, { type: argon2.argon2id });
    }

    private async verifyPassword(hash: string, plain: string): Promise<boolean> {
        return argon2.verify(hash, plain);
    }

    // Token helpers
    private signAccessToken(payload: JwtPayload): string {
        return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
    }

    private generateRawRefreshToken(): string {
        return crypto.randomBytes(64).toString('hex');
    }

    private hashRefreshToken(rawToken: string): string {
        return crypto.createHash('sha256').update(rawToken).digest('hex');
    }

    private async issueTokenPair(userId: string, email: string): Promise<TokenPair> {
        const accessToken = this.signAccessToken({ sub: userId, email });

        const rawRefreshToken = this.generateRawRefreshToken();
        const tokenHash = this.hashRefreshToken(rawRefreshToken);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRES_IN_DAYS);

        await prisma.refreshToken.create({
            data: { userId, tokenHash, expiresAt },
        });

        return { accessToken, refreshToken: rawRefreshToken };
    }

    async signup(data: SignupInput) {
        const { email, password, name } = data;

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw Object.assign(new Error('Email already in use'), {
                statusCode: statusCode.CONFLICT,
            });
        }

        const hashedPassword = await this.hashPassword(password);
        const user = await prisma.user.create({
            data: { email, password: hashedPassword, name },
        });

        return { id: user.id, email: user.email, name: user.name };
    }

    async login(data: LoginInput): Promise<TokenPair> {
        const { email, password } = data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive) {
            throw Object.assign(new Error('Invalid email or password'), {
                statusCode: statusCode.UNAUTHORIZED,
            });
        }

        const validPassword = await this.verifyPassword(user.password, password);
        if (!validPassword) {
            throw Object.assign(new Error('Invalid email or password'), {
                statusCode: statusCode.UNAUTHORIZED,
            });
        }

        return this.issueTokenPair(user.id, user.email);
    }

    async refreshTokens(rawRefreshToken: string): Promise<TokenPair> {
        const tokenHash = this.hashRefreshToken(rawRefreshToken);

        const existing = await prisma.refreshToken.findUnique({
            where: { tokenHash },
            include: { user: true },
        });

        if (!existing) {
            throw Object.assign(new Error('Invalid refresh token'), {
                statusCode: statusCode.UNAUTHORIZED,
            });
        }

        if (existing.revoked) {
            await prisma.refreshToken.updateMany({
                where: { userId: existing.userId, revoked: false },
                data: { revoked: true, revokedAt: new Date() },
            });
            throw Object.assign(
                new Error('Refresh token reuse detected, all sessions revoked'),
                { statusCode: statusCode.UNAUTHORIZED },
            );
        }

        if (existing.expiresAt < new Date()) {
            throw Object.assign(new Error('Refresh token expired'), {
                statusCode: statusCode.UNAUTHORIZED,
            });
        }

        const { accessToken, refreshToken: newRawRefreshToken } = await this.issueTokenPair(
            existing.userId,
            existing.user.email,
        );
        const newTokenHash = this.hashRefreshToken(newRawRefreshToken);

        await prisma.refreshToken.update({
            where: { id: existing.id },
            data: { revoked: true, revokedAt: new Date(), replacedBy: newTokenHash },
        });

        return { accessToken, refreshToken: newRawRefreshToken };
    }

    async logout(rawRefreshToken: string): Promise<void> {
        const tokenHash = this.hashRefreshToken(rawRefreshToken);
        await prisma.refreshToken.updateMany({
            where: { tokenHash, revoked: false },
            data: { revoked: true, revokedAt: new Date() },
        });
    }

    async getMe(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, name: true, createdAt: true },
        });

        if (!user) {
            throw Object.assign(new Error('User not found'), {
                statusCode: statusCode.NOT_FOUND,
            });
        }

        return user;
    }

    verifyAccessToken(token: string): JwtPayload {
        return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
    }
}

export default new AuthService();