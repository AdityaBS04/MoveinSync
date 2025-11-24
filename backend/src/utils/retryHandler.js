/**
 * Retry Handler Utility
 * Implements exponential backoff for failed operations
 *
 * Time Complexity: O(k) where k is number of retry attempts
 * Space Complexity: O(1)
 *
 * Pattern: Exponential Backoff with Jitter
 * - Delay = min(maxDelay, baseDelay * 2^attempt) + random jitter
 * - Prevents thundering herd problem
 * - Reduces load on failing systems
 */

/**
 * Retry async function with exponential backoff
 *
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry configuration
 * @returns {Promise} - Resolves with function result or rejects after max attempts
 *
 * Time Complexity: O(k) where k = maxAttempts
 * Space Complexity: O(1)
 */
async function retryWithBackoff(fn, options = {}) {
  const {
    maxAttempts = 3,
    baseDelay = 1000, // 1 second
    maxDelay = 10000, // 10 seconds
    shouldRetry = (error) => true, // Custom retry condition
    onRetry = (error, attempt) => {}, // Callback on retry
    jitter = true // Add randomness to delay
  } = options;

  let lastError;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Execute function
      const result = await fn();
      return result;
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt === maxAttempts - 1 || !shouldRetry(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff
      // Time Complexity: O(1)
      let delay = Math.min(maxDelay, baseDelay * Math.pow(2, attempt));

      // Add jitter to prevent thundering herd
      if (jitter) {
        delay = delay * (0.5 + Math.random() * 0.5); // 50-100% of calculated delay
      }

      console.warn(`Retry attempt ${attempt + 1}/${maxAttempts} after ${Math.round(delay)}ms:`, error.message);

      // Call retry callback
      onRetry(error, attempt + 1);

      // Wait before retrying
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Circuit Breaker Pattern
 * Prevents cascading failures by failing fast when service is down
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Circuit tripped, requests fail immediately
 * - HALF_OPEN: Testing if service recovered
 *
 * Time Complexity: O(1) for state check
 * Space Complexity: O(1)
 */
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.successThreshold = options.successThreshold || 2;
    this.timeout = options.timeout || 60000; // 1 minute
    this.resetTimeout = options.resetTimeout || 30000; // 30 seconds

    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();
  }

  /**
   * Execute function with circuit breaker protection
   * Time Complexity: O(1)
   */
  async execute(fn) {
    if (this.state === 'OPEN') {
      // Circuit is open, check if we should try again
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN - service unavailable');
      }
      // Try to transition to HALF_OPEN
      this.state = 'HALF_OPEN';
      this.successCount = 0;
      console.log('Circuit breaker transitioning to HALF_OPEN');
    }

    try {
      // Execute function with timeout
      const result = await Promise.race([
        fn(),
        timeoutPromise(this.timeout)
      ]);

      // Success!
      this.onSuccess();
      return result;
    } catch (error) {
      // Failure!
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful execution
   * Time Complexity: O(1)
   */
  onSuccess() {
    this.failureCount = 0;

    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = 'CLOSED';
        console.log('Circuit breaker CLOSED - service recovered');
      }
    }
  }

  /**
   * Handle failed execution
   * Time Complexity: O(1)
   */
  onFailure() {
    this.failureCount++;

    if (this.state === 'HALF_OPEN' || this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
      console.error(`Circuit breaker OPEN - too many failures (${this.failureCount})`);
    }
  }

  /**
   * Get current state
   * Time Complexity: O(1)
   */
  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      nextAttempt: this.state === 'OPEN' ? new Date(this.nextAttempt).toISOString() : null
    };
  }

  /**
   * Reset circuit breaker
   * Time Complexity: O(1)
   */
  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();
  }
}

/**
 * Helper functions
 */

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function timeoutPromise(ms) {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Operation timeout')), ms)
  );
}

/**
 * Predefined retry conditions
 */
const retryConditions = {
  // Retry on network errors
  network: (error) => {
    return error.code === 'ECONNREFUSED' ||
           error.code === 'ETIMEDOUT' ||
           error.code === 'ENOTFOUND';
  },

  // Retry on temporary errors (5xx status codes)
  serverError: (error) => {
    return error.response && error.response.status >= 500;
  },

  // Retry on rate limiting (429 status code)
  rateLimited: (error) => {
    return error.response && error.response.status === 429;
  },

  // Retry on all errors
  always: () => true,

  // Never retry
  never: () => false
};

module.exports = {
  retryWithBackoff,
  CircuitBreaker,
  retryConditions
};
