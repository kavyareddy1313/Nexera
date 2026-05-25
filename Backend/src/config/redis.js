import Redis from 'ioredis';
import { env } from './env.js';

let redisClient = null;

export const getRedisClient = () => {
  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    });
    
    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('✅ Connected to Redis');
    });
  }
  return redisClient;
};

// Initialize connection asynchronously without blocking export
getRedisClient().connect().catch(err => {
  console.error('Failed to connect to Redis on startup:', err);
});

export const getCache = async (key) => {
  try {
    const data = await getRedisClient().get(key);
    if (data) return JSON.parse(data);
  } catch (error) {
    console.error(`Redis Get Error [${key}]:`, error);
  }
  return null;
};

export const setCache = async (key, value, ttlSeconds = 60) => {
  try {
    await getRedisClient().setex(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    console.error(`Redis Set Error [${key}]:`, error);
  }
};

export const deleteCache = async (key) => {
  try {
    await getRedisClient().del(key);
  } catch (error) {
    console.error(`Redis Del Error [${key}]:`, error);
  }
};
