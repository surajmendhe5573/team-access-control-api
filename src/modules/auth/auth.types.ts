export interface JwtPayload {
    sub: string;
    email: string;
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

export interface SignupInput {
    email: string;
    password: string;
    name?: string;
}

export interface LoginInput {
    email: string;
    password: string;
}