require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const floorPlanRoutes = require('./routes/floorPlan');
const bookingRoutes = require('./routes/booking');
const pathfindingRoutes = require('./routes/pathfinding');
const versionRoutes = require('./routes/version');
const activityLogRoutes = require('./routes/activityLog');
const userModel = require('./models/userModel');
const seedDatabase = require('./scripts/seed');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/floor-plans', floorPlanRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/pathfinding', pathfindingRoutes);
app.use('/api/versions', versionRoutes);
app.use('/api/activity-logs', activityLogRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Auto-seed database if no users exist
const initializeApp = async () => {
  try {
    if (!userModel.hasUsers()) {
      console.log('📦 No users found. Running initial seed...');
      await seedDatabase();
    } else {
      console.log('✅ Database already contains users');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    process.exit(1);
  }
};

initializeApp();
