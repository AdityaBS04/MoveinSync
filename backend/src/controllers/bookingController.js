const bookingModel = require('../models/bookingModel');
const logger = require('../utils/logger');
const floorPlanModel = require('../models/floorPlanModel');
const roomRecommendationService = require('../services/roomRecommendationService');
const { deleteCachePattern } = require('../config/redis');

/**
 * Invalidate booking-related caches
 * Clears all booking caches to ensure fresh data after mutations
 */
const invalidateBookingCaches = async (userId = null) => {
  try {
    // Clear all booking list caches
    await deleteCachePattern('bookings:*');
    await deleteCachePattern('user_bookings:*');

    // If specific user, clear their cache
    if (userId) {
      await deleteCachePattern(`*${userId}*booking*`);
    }

    console.log('🗑️  Booking caches invalidated');
  } catch (error) {
    console.error('Failed to invalidate booking caches:', error);
  }
};

const bookingController = {
  // Get all bookings
  getAll: (req, res) => {
    try {
      const bookings = bookingModel.findAll();
      res.json({
        success: true,
        bookings
      });
    } catch (error) {
      console.error('Get all bookings error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  // Get booking by ID
  getById: (req, res) => {
    try {
      const { id } = req.params;
      const booking = bookingModel.findById(id);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      res.json({
        success: true,
        booking
      });
    } catch (error) {
      console.error('Get booking error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  // Get user's bookings
  getMyBookings: (req, res) => {
    try {
      const bookings = bookingModel.findByUser(req.user.userId);
      res.json({
        success: true,
        bookings
      });
    } catch (error) {
      console.error('Get my bookings error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  // Get bookings for a floor plan
  getByFloorPlan: (req, res) => {
    try {
      const { floorPlanId } = req.params;
      const bookings = bookingModel.findByFloorPlan(floorPlanId);
      res.json({
        success: true,
        bookings
      });
    } catch (error) {
      console.error('Get floor plan bookings error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  // Get bookings for a specific room
  getByRoom: (req, res) => {
    try {
      const { floorPlanId, roomId } = req.params;
      const bookings = bookingModel.findByRoom(floorPlanId, roomId);
      res.json({
        success: true,
        bookings
      });
    } catch (error) {
      console.error('Get room bookings error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  // Create booking
  create: async (req, res) => {
    try {
      const { floorPlanId, roomId, roomName, startTime, endTime, title, description, attendees } = req.body;

      // Validation
      if (!floorPlanId || !roomId || !roomName || !startTime || !endTime || !title) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Check if room is available
      const isAvailable = bookingModel.isRoomAvailable(floorPlanId, roomId, startTime, endTime);

      if (!isAvailable) {
        return res.status(409).json({
          success: false,
          message: 'Room is not available for the selected time'
        });
      }

      const booking = bookingModel.create({
        floorPlanId,
        roomId,
        roomName,
        userId: req.user.userId,
        startTime,
        endTime,
        title,
        description,
        attendees
      });

      // Invalidate booking caches
      await invalidateBookingCaches(req.user.userId);

      // Log booking creation
      logger.logBooking(req.user, 'create', booking, req);

      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        booking
      });
    } catch (error) {
      console.error('Create booking error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  // Update booking
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { startTime, endTime, title, description, attendees } = req.body;

      const existingBooking = bookingModel.findById(id);
      if (!existingBooking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      // Check ownership
      if (existingBooking.user_id !== req.user.userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this booking'
        });
      }

      // If time is being changed, check availability
      if (startTime || endTime) {
        const newStartTime = startTime || existingBooking.start_time;
        const newEndTime = endTime || existingBooking.end_time;

        const isAvailable = bookingModel.isRoomAvailable(
          existingBooking.floor_plan_id,
          existingBooking.room_id,
          newStartTime,
          newEndTime,
          id
        );

        if (!isAvailable) {
          return res.status(409).json({
            success: false,
            message: 'Room is not available for the selected time'
          });
        }
      }

      const booking = bookingModel.update(id, {
        startTime,
        endTime,
        title,
        description,
        attendees
      });

      // Invalidate booking caches
      await invalidateBookingCaches(req.user.userId);

      // Log booking update
      logger.logBooking(req.user, 'update', booking, req);

      res.json({
        success: true,
        message: 'Booking updated successfully',
        booking
      });
    } catch (error) {
      console.error('Update booking error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  // Cancel booking
  cancel: async (req, res) => {
    try {
      const { id } = req.params;

      const existingBooking = bookingModel.findById(id);
      if (!existingBooking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      // Check ownership
      if (existingBooking.user_id !== req.user.userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to cancel this booking'
        });
      }

      const booking = bookingModel.cancel(id);

      // Invalidate booking caches
      await invalidateBookingCaches(req.user.userId);

      // Log booking cancellation
      logger.logBooking(req.user, 'cancel', booking, req);

      res.json({
        success: true,
        message: 'Booking cancelled successfully',
        booking
      });
    } catch (error) {
      console.error('Cancel booking error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  // Delete booking
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      const existingBooking = bookingModel.findById(id);
      if (!existingBooking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      // Only admin can delete
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can delete bookings'
        });
      }

      bookingModel.delete(id);

      // Invalidate booking caches
      await invalidateBookingCaches();

      res.json({
        success: true,
        message: 'Booking deleted successfully'
      });
    } catch (error) {
      console.error('Delete booking error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  // Get recommended rooms
  getRecommendedRooms: (req, res) => {
    try {
      const { floorPlanId, attendees, startTime, endTime } = req.query;

      if (!floorPlanId || !attendees || !startTime || !endTime) {
        return res.status(400).json({
          success: false,
          message: 'Missing required parameters: floorPlanId, attendees, startTime, endTime'
        });
      }

      const floorPlan = floorPlanModel.findById(floorPlanId);
      if (!floorPlan) {
        return res.status(404).json({
          success: false,
          message: 'Floor plan not found'
        });
      }

      const recommendedRooms = roomRecommendationService.getRecommendedRooms({
        attendees: parseInt(attendees),
        startTime,
        endTime,
        userId: req.user.userId,
        floorPlanId,
        rooms: floorPlan.rooms
      });

      res.json({
        success: true,
        recommendedRooms,
        count: recommendedRooms.length
      });
    } catch (error) {
      console.error('Get recommended rooms error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
};

module.exports = bookingController;
