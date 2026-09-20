export interface RegisterInput {
    email: string;
    password: string;
    name: string;
}

export interface LoginInput {
    email: string;
    password: string;
    device?: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

export interface AccessTokenPayload {
    sub: string; // userId
    email: string;
}

// Matches the shape authService.verifyAccessToken() returns and
// authenticate.ts assigns to req.user
export interface JwtPayload {
    id: string;
    email: string;
    sessionId: string;
}

export interface RefreshTokenPayload {
    sub: string; // userId
    sessionId: string;
}

export interface SafeUser {
    id: string;
    email: string;
    name: string;
    status: string;
}
