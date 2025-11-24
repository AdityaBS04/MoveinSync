require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const floorPlanRoutes = require('./routes/floorPlan');
const bookingRoutes = require('./routes/booking');
const pathfindingRoutes = require('./routes/pathfinding');
const versionRoutes = require('./routes/version');
const activityLogRoutes = require('./routes/activityLog');
const healthRoutes = require('./routes/health');
const userModel = require('./models/userModel');
const seedDatabase = require('./scripts/seed');
const { initRedis, closeRedis } = require('./config/redis');
const { monitoringMiddleware, errorMonitoringMiddleware } = require('./middleware/monitoringMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting to prevent abuse
// Time Complexity: O(1) per request
// Space Complexity: O(n) where n is number of unique IPs
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(limiter);
app.use(monitoringMiddleware); // Track all requests

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/floor-plans', floorPlanRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/pathfinding', pathfindingRoutes);
app.use('/api/versions', versionRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/health', healthRoutes);

// Legacy health check (backwards compatibility)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Error monitoring middleware
app.use(errorMonitoringMiddleware);

// Auto-seed database if no users exist
const initializeApp = async () => {
  try {
    console.log('🚀 Initializing Movensync Server...');

    // Initialize Redis cache
    console.log('📡 Connecting to Redis...');
    await initRedis();

    // Seed database if needed
    if (!userModel.hasUsers()) {
      console.log('📦 No users found. Running initial seed...');
      await seedDatabase();
    } else {
      console.log('✅ Database already contains users');
    }

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`\n✅ Movensync Server Started Successfully`);
      console.log(`🌐 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health/detailed`);
      console.log(`📈 Metrics: http://localhost:${PORT}/api/health/metrics`);
      console.log(`\n🎯 Features Enabled:`);
      console.log(`  ✓ Redis Caching (with graceful fallback)`);
      console.log(`  ✓ System Monitoring & Health Checks`);
      console.log(`  ✓ Retry Logic & Circuit Breakers`);
      console.log(`  ✓ Rate Limiting (100 req/15min per IP)`);
      console.log(`  ✓ Error Tracking & Logging`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('\n⚠️  SIGTERM received, shutting down gracefully...');
      server.close(async () => {
        await closeRedis();
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('\n⚠️  SIGINT received, shutting down gracefully...');
      server.close(async () => {
        await closeRedis();
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    process.exit(1);
  }
};

initializeApp();
