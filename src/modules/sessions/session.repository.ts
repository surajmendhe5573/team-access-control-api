import prisma from '../../config/db.js';

export const sessionRepository = {
    listActiveForUser(userId: string) {
        return prisma.session.findMany({
            where: { userId, revokedAt: null },
            orderBy: { lastUsedAt: 'desc' },
        });
    },

    findById(userId: string, sessionId: string) {
        return prisma.session.findFirst({ where: { id: sessionId, userId } });
    },

    revoke(sessionId: string) {
        return prisma.session.update({
            where: { id: sessionId },
            data: { revokedAt: new Date() },
        });
    },

    revokeAllExcept(userId: string, exceptSessionId: string) {
        return prisma.session.updateMany({
            where: { userId, revokedAt: null, id: { not: exceptSessionId } },
            data: { revokedAt: new Date() },
        });
    },

    revokeAll(userId: string) {
        return prisma.session.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    },
};
