const express = require('express');
const router = express.Router();
const activityLogController = require('../controllers/activityLogController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Get all activity logs (admin only - add role check if needed)
router.get('/', activityLogController.getAll);

// Get activity statistics
router.get('/stats', activityLogController.getStats);

// Get current user's activities
router.get('/me', activityLogController.getMyActivities);

// Get specific log by ID
router.get('/:id', activityLogController.getById);

// Get user's activity history
router.get('/user/:userId', activityLogController.getUserActivities);

// Get entity's activity history
router.get('/entity/:entityType/:entityId', activityLogController.getEntityActivities);

module.exports = router;
