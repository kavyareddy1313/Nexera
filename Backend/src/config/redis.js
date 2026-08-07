import Redis from 'ioredis';
import { env } from './env.js';

let redisClient = null;
let isConnected = false;

export const getRedisClient = () => {
  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: () => null,
    });
    
    redisClient.on('error', () => {
      isConnected = false;
    });

    redisClient.on('connect', () => {
      isConnected = true;
      console.log('✅ Connected to Redis');
    });

    redisClient.on('close', () => {
      isConnected = false;
    });
  }
  return redisClient;
};

// Initialize connection asynchronously without blocking export
getRedisClient().connect().then(() => {
  isConnected = true;
}).catch(() => {
  console.log('ℹ️ Redis server is offline, continuing without Redis caching.');
});

export const getCache = async (key) => {
  if (!isConnected) return null;
  try {
    const data = await getRedisClient().get(key);
    if (data) return JSON.parse(data);
  } catch (error) {
    // Redis cache get error ignored
  }
  return null;
};

export const setCache = async (key, value, ttlSeconds = 60) => {
  if (!isConnected) return;
  try {
    await getRedisClient().setex(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    // Redis cache set error ignored
  }
};

export const deleteCache = async (key) => {
  if (!isConnected) return;
  try {
    await getRedisClient().del(key);
  } catch (error) {
    // Redis cache delete error ignored
  }
};

