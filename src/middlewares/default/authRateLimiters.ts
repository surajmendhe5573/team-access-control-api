import rateLimiter from './rateLimiter.js';

export const loginRateLimiter = rateLimiter({
    windowMs: 60 * 1000,
    max: 5,
    message: 'Too many login attempts. Please try again in a minute.',
    keyPrefix: 'rate_limit:login:',
});

export const registerRateLimiter = rateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: 'Too many registration attempts. Please try again later.',
    keyPrefix: 'rate_limit:register:',
});

// 5 requests/hour/IP
export const forgotPasswordRateLimiter = rateLimiter({
    windowMs: 60 * 60 * 1000, // 1hr
    max: 5,
    message: 'Too many password reset requests. Please try again later.',
    keyPrefix: 'rate_limit:forgot_password:',
});

export const refreshRateLimiter = rateLimiter({
    windowMs: 60 * 1000,
    max: 10,
    message: 'Too many token refresh attempts. Please try again shortly.',
    keyPrefix: 'rate_limit:refresh:',
});
