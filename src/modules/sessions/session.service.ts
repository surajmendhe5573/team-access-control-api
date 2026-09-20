import { sessionRepository } from './session.repository.js';
import type { SafeSession } from './session.types.js';

class AppError extends Error {
    constructor(
        public code: string,
        public statusCode: number,
        message: string,
    ) {
        super(message);
    }
}

function toSafeSession(
    session: {
        id: string;
        device: string | null;
        userAgent: string | null;
        ip: string | null;
        createdAt: Date;
        lastUsedAt: Date;
        expiresAt: Date;
    },
    currentSessionId: string,
): SafeSession {
    return {
        id: session.id,
        device: session.device,
        userAgent: session.userAgent,
        ip: session.ip,
        createdAt: session.createdAt,
        lastUsedAt: session.lastUsedAt,
        expiresAt: session.expiresAt,
        isCurrent: session.id === currentSessionId,
    };
}

export const sessionService = {
    async list(userId: string, currentSessionId: string): Promise<SafeSession[]> {
        const sessions = await sessionRepository.listActiveForUser(userId);
        return sessions.map((s) => toSafeSession(s, currentSessionId));
    },

    async getById(
        userId: string,
        sessionId: string,
        currentSessionId: string,
    ): Promise<SafeSession> {
        const session = await sessionRepository.findById(userId, sessionId);
        if (!session || session.revokedAt) {
            throw new AppError('NOT_FOUND', 404, 'Session not found');
        }
        return toSafeSession(session, currentSessionId);
    },

    async revokeOne(userId: string, sessionId: string): Promise<void> {
        const session = await sessionRepository.findById(userId, sessionId);
        if (!session || session.revokedAt) {
            throw new AppError('NOT_FOUND', 404, 'Session not found');
        }
        await sessionRepository.revoke(sessionId);
    },

    async revokeOthers(userId: string, currentSessionId: string): Promise<void> {
        await sessionRepository.revokeAllExcept(userId, currentSessionId);
    },

    async revokeAll(userId: string): Promise<void> {
        await sessionRepository.revokeAll(userId);
    },
};

export { AppError };
