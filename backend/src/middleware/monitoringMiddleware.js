const { recordRequest, recordError } = require('../utils/monitoring');

/**
 * Monitoring Middleware
 * Tracks request metrics and performance
 *
 * Time Complexity: O(1) per request
 * Space Complexity: O(1) per request
 */

const monitoringMiddleware = (req, res, next) => {
  const startTime = Date.now();

  // Capture response
  const originalSend = res.send;
  const originalJson = res.json;

  res.send = function(data) {
    const duration = Date.now() - startTime;
    const success = res.statusCode < 400;
    recordRequest(req.path, duration, success);
    return originalSend.call(this, data);
  };

  res.json = function(data) {
    const duration = Date.now() - startTime;
    const success = res.statusCode < 400;
    recordRequest(req.path, duration, success);
    return originalJson.call(this, data);
  };

  next();
};

/**
 * Error monitoring middleware
 * Tracks errors and logs them
 *
 * Time Complexity: O(1)
 */
const errorMonitoringMiddleware = (err, req, res, next) => {
  recordError(err, {
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
    user: req.user?.userId
  });

  next(err);
};

module.exports = { monitoringMiddleware, errorMonitoringMiddleware };
