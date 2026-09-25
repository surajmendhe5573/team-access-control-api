import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

redis.on('error', (err: Error) => {
    console.error('Redis connection error:', err);
});

redis.on('connect', () => {
    console.log('Redis connected');
});

export default redis;
