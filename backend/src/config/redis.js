const redis = require('redis');

/**
 * Redis Cache Configuration
 *
 * Time Complexity: O(1) for get/set operations
 * Space Complexity: O(n) where n is number of cached items
 *
 * Cache Strategy:
 * - TTL-based eviction (Time To Live)
 * - LRU (Least Recently Used) fallback when memory limit reached
 */

let redisClient = null;
let isRedisAvailable = false;

const initRedis = async () => {
  try {
    // Create Redis client
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          // Exponential backoff: 2^retries * 100ms, max 3000ms
          // Time Complexity: O(1)
          if (retries > 10) {
            console.error('Redis: Max reconnection attempts reached');
            return new Error('Redis connection failed');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    // Error handling
    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
      isRedisAvailable = false;
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully');
      isRedisAvailable = true;
    });

    redisClient.on('disconnect', () => {
      console.warn('⚠️  Redis disconnected');
      isRedisAvailable = false;
    });

    // Connect to Redis
    await redisClient.connect();

    return redisClient;
  } catch (error) {
    console.error('Redis initialization failed:', error.message);
    console.warn('⚠️  System will run without caching');
    isRedisAvailable = false;
    return null;
  }
};

/**
 * Get value from cache
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 */
const getCache = async (key) => {
  if (!isRedisAvailable || !redisClient) return null;

  try {
    const value = await redisClient.get(key);
    if (value) {
      return JSON.parse(value);
    }
    return null;
  } catch (error) {
    console.error(`Cache GET error for key ${key}:`, error);
    return null;
  }
};

/**
 * Set value in cache with TTL
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 *
 * @param {string} key - Cache key
 * @param {any} value - Value to cache (will be JSON stringified)
 * @param {number} ttl - Time to live in seconds (default: 300s = 5min)
 */
const setCache = async (key, value, ttl = 300) => {
  if (!isRedisAvailable || !redisClient) return false;

  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Cache SET error for key ${key}:`, error);
    return false;
  }
};

/**
 * Delete value from cache
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 */
const deleteCache = async (key) => {
  if (!isRedisAvailable || !redisClient) return false;

  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error(`Cache DELETE error for key ${key}:`, error);
    return false;
  }
};

/**
 * Delete multiple keys matching pattern
 * Time Complexity: O(n) where n is number of keys matching pattern
 * Space Complexity: O(n)
 */
const deleteCachePattern = async (pattern) => {
  if (!isRedisAvailable || !redisClient) return false;

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (error) {
    console.error(`Cache DELETE PATTERN error for ${pattern}:`, error);
    return false;
  }
};

/**
 * Check if cache is available
 * Time Complexity: O(1)
 */
const isCacheAvailable = () => {
  return isRedisAvailable;
};

/**
 * Close Redis connection gracefully
 * Time Complexity: O(1)
 */
const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    console.log('Redis connection closed');
  }
};

module.exports = {
  initRedis,
  getCache,
  setCache,
  deleteCache,
  deleteCachePattern,
  isCacheAvailable,
  closeRedis
};
