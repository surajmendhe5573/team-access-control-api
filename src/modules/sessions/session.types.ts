export interface SafeSession {
    id: string;
    device: string | null;
    userAgent: string | null;
    ip: string | null;
    createdAt: Date;
    lastUsedAt: Date;
    expiresAt: Date;
    isCurrent: boolean;
}
