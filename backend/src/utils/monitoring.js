const os = require('os');
const { isCacheAvailable } = require('../config/redis');

/**
 * System Monitoring Utility
 *
 * Provides real-time metrics for:
 * - System health
 * - Performance metrics
 * - Resource utilization
 * - Error tracking
 */

// In-memory metrics storage
// Time Complexity: O(1) for updates
// Space Complexity: O(1) - fixed size
const metrics = {
  requests: {
    total: 0,
    successful: 0,
    failed: 0,
    byEndpoint: {}
  },
  performance: {
    avgResponseTime: 0,
    totalResponseTime: 0,
    requestCount: 0
  },
  errors: {
    total: 0,
    last10: [] // Ring buffer - maintains last 10 errors
  },
  database: {
    queries: 0,
    errors: 0,
    avgQueryTime: 0
  },
  cache: {
    hits: 0,
    misses: 0,
    hitRate: 0
  },
  system: {
    startTime: Date.now(),
    uptime: 0
  }
};

/**
 * Record request metrics
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 */
const recordRequest = (endpoint, duration, success = true) => {
  metrics.requests.total++;

  if (success) {
    metrics.requests.successful++;
  } else {
    metrics.requests.failed++;
  }

  // Track by endpoint
  if (!metrics.requests.byEndpoint[endpoint]) {
    metrics.requests.byEndpoint[endpoint] = { count: 0, avgTime: 0, totalTime: 0 };
  }

  const endpointMetrics = metrics.requests.byEndpoint[endpoint];
  endpointMetrics.count++;
  endpointMetrics.totalTime += duration;
  endpointMetrics.avgTime = endpointMetrics.totalTime / endpointMetrics.count;

  // Update global performance metrics
  metrics.performance.totalResponseTime += duration;
  metrics.performance.requestCount++;
  metrics.performance.avgResponseTime =
    metrics.performance.totalResponseTime / metrics.performance.requestCount;
};

/**
 * Record error
 * Time Complexity: O(1)
 * Space Complexity: O(1) - ring buffer maintains fixed size
 */
const recordError = (error, context = {}) => {
  metrics.errors.total++;

  const errorRecord = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  };

  // Ring buffer - keep only last 10 errors
  if (metrics.errors.last10.length >= 10) {
    metrics.errors.last10.shift();
  }
  metrics.errors.last10.push(errorRecord);
};

/**
 * Record cache metrics
 * Time Complexity: O(1)
 */
const recordCacheHit = () => {
  metrics.cache.hits++;
  metrics.cache.hitRate =
    metrics.cache.hits / (metrics.cache.hits + metrics.cache.misses);
};

const recordCacheMiss = () => {
  metrics.cache.misses++;
  metrics.cache.hitRate =
    metrics.cache.hits / (metrics.cache.hits + metrics.cache.misses);
};

/**
 * Record database query
 * Time Complexity: O(1)
 */
const recordDatabaseQuery = (duration, success = true) => {
  metrics.database.queries++;
  if (!success) {
    metrics.database.errors++;
  }
  // Update average query time
  metrics.database.avgQueryTime =
    ((metrics.database.avgQueryTime * (metrics.database.queries - 1)) + duration) /
    metrics.database.queries;
};

/**
 * Get system health status
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 */
const getSystemHealth = () => {
  const uptime = Date.now() - metrics.system.startTime;
  const uptimeSeconds = Math.floor(uptime / 1000);

  const memoryUsage = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  const cpuUsage = process.cpuUsage();

  // Health status determination
  const errorRate = metrics.requests.total > 0
    ? metrics.requests.failed / metrics.requests.total
    : 0;

  const memoryUsagePercent = (usedMem / totalMem) * 100;

  let healthStatus = 'healthy';
  const issues = [];

  if (errorRate > 0.1) {
    healthStatus = 'degraded';
    issues.push(`High error rate: ${(errorRate * 100).toFixed(2)}%`);
  }

  if (memoryUsagePercent > 90) {
    healthStatus = 'unhealthy';
    issues.push(`Critical memory usage: ${memoryUsagePercent.toFixed(2)}%`);
  } else if (memoryUsagePercent > 80) {
    healthStatus = 'degraded';
    issues.push(`High memory usage: ${memoryUsagePercent.toFixed(2)}%`);
  }

  if (!isCacheAvailable()) {
    healthStatus = healthStatus === 'healthy' ? 'degraded' : healthStatus;
    issues.push('Redis cache unavailable');
  }

  return {
    status: healthStatus,
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: uptimeSeconds,
      formatted: formatUptime(uptimeSeconds)
    },
    system: {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      cpus: os.cpus().length
    },
    memory: {
      total: formatBytes(totalMem),
      used: formatBytes(usedMem),
      free: formatBytes(freeMem),
      usagePercent: memoryUsagePercent.toFixed(2),
      process: {
        heapUsed: formatBytes(memoryUsage.heapUsed),
        heapTotal: formatBytes(memoryUsage.heapTotal),
        external: formatBytes(memoryUsage.external),
        rss: formatBytes(memoryUsage.rss)
      }
    },
    cpu: {
      user: (cpuUsage.user / 1000000).toFixed(2) + ' ms',
      system: (cpuUsage.system / 1000000).toFixed(2) + ' ms'
    },
    services: {
      redis: isCacheAvailable() ? 'connected' : 'disconnected',
      database: 'connected'
    },
    issues: issues.length > 0 ? issues : null
  };
};

/**
 * Get performance metrics
 * Time Complexity: O(n) where n is number of tracked endpoints
 */
const getMetrics = () => {
  return {
    ...metrics,
    system: {
      ...metrics.system,
      uptime: Date.now() - metrics.system.startTime
    }
  };
};

/**
 * Reset metrics (for testing/debugging)
 * Time Complexity: O(1)
 */
const resetMetrics = () => {
  metrics.requests = { total: 0, successful: 0, failed: 0, byEndpoint: {} };
  metrics.performance = { avgResponseTime: 0, totalResponseTime: 0, requestCount: 0 };
  metrics.errors = { total: 0, last10: [] };
  metrics.database = { queries: 0, errors: 0, avgQueryTime: 0 };
  metrics.cache = { hits: 0, misses: 0, hitRate: 0 };
  metrics.system.startTime = Date.now();
};

/**
 * Helper functions
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(' ');
}

module.exports = {
  recordRequest,
  recordError,
  recordCacheHit,
  recordCacheMiss,
  recordDatabaseQuery,
  getSystemHealth,
  getMetrics,
  resetMetrics
};
