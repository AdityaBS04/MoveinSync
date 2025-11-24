const { getCache, setCache } = require('../config/redis');

/**
 * Cache Middleware
 * Caches GET requests to reduce database load
 *
 * Time Complexity: O(1) for cache hit, O(n) for cache miss (where n is query complexity)
 * Space Complexity: O(1) per request
 *
 * Trade-off: Memory vs Speed
 * - Uses Redis memory to store responses
 * - Significantly reduces database queries
 * - 5-10x faster response times for cached data
 */

/**
 * Cache middleware factory
 * @param {number} ttl - Time to live in seconds
 * @param {function} keyGenerator - Optional custom key generator
 */
const cacheMiddleware = (ttl = 300, keyGenerator = null) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Generate cache key
      const cacheKey = keyGenerator
        ? keyGenerator(req)
        : `cache:${req.originalUrl}:${req.user?.userId || 'anonymous'}`;

      // Try to get from cache
      const cachedData = await getCache(cacheKey);

      if (cachedData) {
        // Cache HIT - Return cached data
        console.log(`✅ Cache HIT: ${cacheKey}`);
        return res.json(cachedData);
      }

      // Cache MISS - Store original json method
      console.log(`❌ Cache MISS: ${cacheKey}`);
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = function(data) {
        // Only cache successful responses
        if (data.success !== false) {
          setCache(cacheKey, data, ttl).catch(err => {
            console.error('Failed to set cache:', err);
          });
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      // Don't break the request on cache errors
      next();
    }
  };
};

/**
 * Cache key generators for different resources
 */
const cacheKeys = {
  floorPlan: (req) => `floor_plan:${req.params.id}`,
  floorPlanList: (req) => `floor_plans:${req.user?.userId}:${req.user?.role}`,
  booking: (req) => `booking:${req.params.id}`,
  bookingList: (req) => `bookings:${req.user?.userId}`,
  userBookings: (req) => `user_bookings:${req.user?.userId}`,
  activityLogs: (req) => `activity:${req.user?.userId}:${req.query.limit || 50}`
};

module.exports = { cacheMiddleware, cacheKeys };
