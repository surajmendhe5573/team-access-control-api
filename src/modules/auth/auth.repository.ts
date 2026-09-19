import prisma from '../../config/db.js';

export const authRepository = {
    findUserByEmail(email: string) {
        return prisma.user.findUnique({ where: { email } });
    },

    findUserById(id: string) {
        return prisma.user.findUnique({ where: { id } });
    },

    createUser(data: { email: string; passwordHash: string; name: string }) {
        return prisma.user.create({ data });
    },

    markEmailVerified(userId: string) {
        return prisma.user.update({
            where: { id: userId },
            data: { status: 'ACTIVE', emailVerifiedAt: new Date() },
        });
    },

    updatePasswordHash(userId: string, passwordHash: string) {
        return prisma.user.update({
            where: { id: userId },
            data: { passwordHash },
        });
    },

    // ---- Sessions ----
    createSession(data: {
        userId: string;
        refreshTokenHash: string;
        device?: string;
        userAgent?: string;
        ip?: string;
        expiresAt: Date;
    }) {
        return prisma.session.create({ data });
    },

    findSessionByRefreshTokenHash(refreshTokenHash: string) {
        return prisma.session.findUnique({ where: { refreshTokenHash } });
    },

    findSessionById(id: string) {
        return prisma.session.findUnique({ where: { id } });
    },

    rotateSession(sessionId: string, data: { newRefreshTokenHash: string; newExpiresAt: Date }) {
        // Create the new session row, and mark old one revoked but linked via rotatedFromId
        return prisma.$transaction(async (tx) => {
            await tx.session.update({
                where: { id: sessionId },
                data: { revokedAt: new Date() },
            });

            const oldSession = await tx.session.findUniqueOrThrow({
                where: { id: sessionId },
            });

            return tx.session.create({
                data: {
                    userId: oldSession.userId,
                    refreshTokenHash: data.newRefreshTokenHash,
                    rotatedFromId: sessionId,
                    device: oldSession.device,
                    userAgent: oldSession.userAgent,
                    ip: oldSession.ip,
                    expiresAt: data.newExpiresAt,
                },
            });
        });
    },

    revokeSession(sessionId: string) {
        return prisma.session.update({
            where: { id: sessionId },
            data: { revokedAt: new Date() },
        });
    },

    revokeAllSessionsForUser(userId: string) {
        return prisma.session.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    },

    // If a rotated (already-used) session's refresh token is presented again,
    // this walks the chain forward from sessionId to find and revoke every
    // descendant session created via rotation — used for reuse detection.
    async revokeSessionChain(sessionId: string) {
        const chain: string[] = [sessionId];
        let current = sessionId;

        // walk forward through rotated children
        // (rotatedFromId points backward, so we search for children pointing at `current`)
        for (;;) {
            const child = await prisma.session.findFirst({
                where: { rotatedFromId: current },
            });
            if (!child) break;
            chain.push(child.id);
            current = child.id;
        }

        return prisma.session.updateMany({
            where: { id: { in: chain } },
            data: { revokedAt: new Date() },
        });
    },

    // ---- Email verification tokens ----
    createEmailVerificationToken(data: { userId: string; tokenHash: string; expiresAt: Date }) {
        return prisma.emailVerificationToken.create({ data });
    },

    findEmailVerificationTokenByHash(tokenHash: string) {
        return prisma.emailVerificationToken.findUnique({ where: { tokenHash } });
    },

    markEmailVerificationTokenUsed(id: string) {
        return prisma.emailVerificationToken.update({
            where: { id },
            data: { usedAt: new Date() },
        });
    },

    // ---- Password reset tokens ----
    createPasswordResetToken(data: { userId: string; tokenHash: string; expiresAt: Date }) {
        return prisma.passwordResetToken.create({ data });
    },

    findPasswordResetTokenByHash(tokenHash: string) {
        return prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    },

    markPasswordResetTokenUsed(id: string) {
        return prisma.passwordResetToken.update({
            where: { id },
            data: { usedAt: new Date() },
        });
    },
};
