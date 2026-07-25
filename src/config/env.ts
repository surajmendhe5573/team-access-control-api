export const config = {
    cors: {
        origins: (
            process.env.CORS_ORIGINS ||
            'http://localhost:5173,https://local.traguin.thetiger.live:5173'
        )
            .split(',')
            .map((origin) => origin.trim()),
    },
};
