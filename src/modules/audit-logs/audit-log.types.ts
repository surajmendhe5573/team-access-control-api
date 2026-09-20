export interface SafeAuditLog {
    id: string;
    actorUserId: string;
    organizationId: string | null;
    action: string;
    targetType: string | null;
    targetId: string | null;
    ip: string | null;
    userAgent: string | null;
    metadata: unknown;
    requestId: string | null;
    createdAt: Date;
    actor: { id: string; name: string; email: string } | null;
}

export interface AuditLogFilters {
    userId?: string;
    action?: string;
    targetType?: string;
    from?: Date;
    to?: Date;
}
