function required(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

export const config = {
    port: Number(process.env.PORT) || 5000,
    nodeEnv: process.env.NODE_ENV || 'local',

    cors: {
        origins: (process.env.CORS_ORIGINS || 'http://localhost:5000')
            .split(',')
            .map((origin) => origin.trim()),
    },

    jwt: {
        accessSecret: required('JWT_ACCESS_SECRET'),
        refreshSecret: required('JWT_REFRESH_SECRET'),
        accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
};
