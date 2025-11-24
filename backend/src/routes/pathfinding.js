const express = require('express');
const router = express.Router();
const pathfindingController = require('../controllers/pathfindingController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Find path between two rooms
router.post('/find-path', pathfindingController.findPath);

module.exports = router;
