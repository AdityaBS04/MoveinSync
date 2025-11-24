const express = require('express');
const router = express.Router();
const { getSystemHealth, getMetrics } = require('../utils/monitoring');
const { isCacheAvailable } = require('../config/redis');

/**
 * Health Check Routes
 *
 * Time Complexity: O(1) for all endpoints
 * Space Complexity: O(1)
 */

/**
 * Basic health check
 * Returns simple status for load balancers
 */
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

/**
 * Detailed health check
 * Returns comprehensive system health information
 */
router.get('/detailed', (req, res) => {
  const health = getSystemHealth();
  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 503 : 500;

  res.status(statusCode).json({
    success: true,
    ...health
  });
});

/**
 * Metrics endpoint
 * Returns performance and usage metrics
 */
router.get('/metrics', (req, res) => {
  const metrics = getMetrics();

  res.json({
    success: true,
    metrics,
    timestamp: new Date().toISOString()
  });
});

/**
 * Readiness probe
 * Checks if service is ready to accept traffic
 */
router.get('/ready', (req, res) => {
  const isReady = isCacheAvailable() !== undefined; // System initialized

  res.status(isReady ? 200 : 503).json({
    ready: isReady,
    timestamp: new Date().toISOString()
  });
});

/**
 * Liveness probe
 * Checks if service is alive (not deadlocked)
 */
router.get('/live', (req, res) => {
  res.json({
    alive: true,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
