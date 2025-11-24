const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');
const { cacheMiddleware, cacheKeys } = require('../middleware/cacheMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Get all bookings (admin only - could add role check) - with caching
router.get('/', cacheMiddleware(180, cacheKeys.bookingList), bookingController.getAll);

// Get user's bookings - with caching
router.get('/my-bookings', cacheMiddleware(180, cacheKeys.userBookings), bookingController.getMyBookings);

// Get recommended rooms - with shorter cache (60s)
router.get('/recommended-rooms', cacheMiddleware(60), bookingController.getRecommendedRooms);

// Get bookings for a floor plan - with caching
router.get('/floor-plan/:floorPlanId', cacheMiddleware(180), bookingController.getByFloorPlan);

// Get bookings for a specific room - with caching
router.get('/floor-plan/:floorPlanId/room/:roomId', cacheMiddleware(180), bookingController.getByRoom);

// Get booking by ID - with caching
router.get('/:id', cacheMiddleware(180, cacheKeys.booking), bookingController.getById);

// Create booking
router.post('/', bookingController.create);

// Update booking
router.put('/:id', bookingController.update);

// Cancel booking
router.patch('/:id/cancel', bookingController.cancel);

// Delete booking (admin only)
router.delete('/:id', bookingController.delete);

module.exports = router;
