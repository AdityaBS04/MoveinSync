const express = require('express');
const router = express.Router();
const floorPlanController = require('../controllers/floorPlanController');
const authMiddleware = require('../middleware/authMiddleware');
const { cacheMiddleware, cacheKeys } = require('../middleware/cacheMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Get all floor plans (with caching)
router.get('/', cacheMiddleware(300, cacheKeys.floorPlanList), floorPlanController.getAll);

// Get user's floor plans (with caching)
router.get('/my-plans', cacheMiddleware(300, cacheKeys.floorPlanList), floorPlanController.getMyPlans);

// Get floor plan by ID (with caching)
router.get('/:id', cacheMiddleware(300, cacheKeys.floorPlan), floorPlanController.getById);

// Create floor plan (admin only - we can add role check later)
router.post('/', floorPlanController.create);

// Update floor plan
router.put('/:id', floorPlanController.update);

// Delete floor plan
router.delete('/:id', floorPlanController.delete);

// Publish floor plan (admin only)
router.post('/:id/publish', floorPlanController.publish);

// Unpublish floor plan (admin only)
router.post('/:id/unpublish', floorPlanController.unpublish);

module.exports = router;
