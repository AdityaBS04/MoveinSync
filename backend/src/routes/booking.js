const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Get all bookings (admin only - could add role check)
router.get('/', bookingController.getAll);

// Get user's bookings
router.get('/my-bookings', bookingController.getMyBookings);

// Get recommended rooms
router.get('/recommended-rooms', bookingController.getRecommendedRooms);

// Get bookings for a floor plan
router.get('/floor-plan/:floorPlanId', bookingController.getByFloorPlan);

// Get bookings for a specific room
router.get('/floor-plan/:floorPlanId/room/:roomId', bookingController.getByRoom);

// Get booking by ID
router.get('/:id', bookingController.getById);

// Create booking
router.post('/', bookingController.create);

// Update booking
router.put('/:id', bookingController.update);

// Cancel booking
router.patch('/:id/cancel', bookingController.cancel);

// Delete booking (admin only)
router.delete('/:id', bookingController.delete);

module.exports = router;
