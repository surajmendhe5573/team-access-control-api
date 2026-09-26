import type { RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';

import redis from '../../config/redis.js';

const sendRedisCommand = redis.call.bind(redis);

interface RateLimiterOptions {
    windowMs?: number;
    max?: number;
    message?: string;
    keyPrefix?: string;
}

const rateLimiter = ({
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = 'Too many requests, please try again later.',
    keyPrefix = 'rate_limit:default:',
}: RateLimiterOptions = {}): RequestHandler => {
    const redisStoreOptions: any = {
        sendCommand: sendRedisCommand,
        prefix: keyPrefix,
    };

    return rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        store: new RedisStore(redisStoreOptions),
        handler: (_req, res) => {
            const retryAfterSeconds = Math.ceil(windowMs / 1000);
            res.set('Retry-After', String(retryAfterSeconds));
            res.status(429).json({
                status: false,
                message,
                code: 'RATE_LIMITED',
                timestamp: new Date().toISOString(),
            });
        },
    });
};

export default rateLimiter;
