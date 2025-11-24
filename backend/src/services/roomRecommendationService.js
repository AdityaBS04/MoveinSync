const bookingModel = require('../models/bookingModel');

/**
 * Room Recommendation Service
 * Provides intelligent meeting room suggestions based on:
 * - Capacity requirements
 * - Availability
 * - Proximity to user's last booking
 * - Booking history/preferences
 */

const roomRecommendationService = {
  /**
   * Get recommended rooms for a booking
   * @param {Object} criteria - { attendees, startTime, endTime, userId, floorPlanId, rooms }
   * @returns {Array} Sorted array of recommended rooms with scores
   */
  getRecommendedRooms: (criteria) => {
    const { attendees, startTime, endTime, userId, floorPlanId, rooms } = criteria;

    // Filter bookable rooms (meeting and conference rooms)
    const bookableRooms = rooms.filter(room =>
      room.type === 'meeting_room' || room.type === 'conference_room'
    );

    // Get room capacities
    const ROOM_CAPACITIES = {
      meeting_room: 10,
      conference_room: 25
    };

    // Filter by capacity
    const roomsWithCapacity = bookableRooms.filter(room => {
      const capacity = ROOM_CAPACITIES[room.type];
      return capacity >= attendees;
    });

    if (roomsWithCapacity.length === 0) {
      return [];
    }

    // Check availability for each room
    const availableRooms = roomsWithCapacity.filter(room => {
      return bookingModel.isRoomAvailable(floorPlanId, room.id, startTime, endTime);
    });

    if (availableRooms.length === 0) {
      return [];
    }

    // Get user's booking history
    const userBookings = bookingModel.findByUser(userId);
    const lastBooking = userBookings.length > 0 ? userBookings[0] : null;

    // Score each room
    const scoredRooms = availableRooms.map(room => {
      let score = 0;
      const capacity = ROOM_CAPACITIES[room.type];

      // 1. Capacity optimization score (30 points max)
      // Prefer rooms that match capacity closely (not too big, not too small)
      const capacityUtilization = attendees / capacity;
      if (capacityUtilization >= 0.6 && capacityUtilization <= 0.9) {
        // Ideal utilization (60-90%)
        score += 30;
      } else if (capacityUtilization >= 0.4 && capacityUtilization < 0.6) {
        // Good utilization (40-60%)
        score += 20;
      } else if (capacityUtilization >= 0.9) {
        // Near full utilization (90%+)
        score += 25;
      } else {
        // Under-utilized (< 40%)
        score += 10;
      }

      // 2. Booking history score (40 points max)
      const roomBookingCount = userBookings.filter(b =>
        b.room_id === room.id && b.status !== 'cancelled'
      ).length;

      if (roomBookingCount > 0) {
        // User has booked this room before - strong preference
        const historyScore = Math.min(roomBookingCount * 10, 40);
        score += historyScore;
      }

      // 3. Last booking proximity score (30 points max)
      if (lastBooking && lastBooking.floor_plan_id === floorPlanId) {
        const lastRoom = rooms.find(r => r.id === lastBooking.room_id);
        if (lastRoom) {
          const distance = calculateDistance(room, lastRoom);
          // Closer rooms get higher scores
          if (distance < 100) {
            score += 30; // Very close
          } else if (distance < 200) {
            score += 20; // Close
          } else if (distance < 400) {
            score += 10; // Moderate distance
          }
        }
      }

      // 4. Room type preference (bonus points)
      if (room.type === 'conference_room' && attendees > 10) {
        score += 5; // Bonus for using conference room for large groups
      } else if (room.type === 'meeting_room' && attendees <= 6) {
        score += 5; // Bonus for using meeting room for small groups
      }

      return {
        ...room,
        score,
        capacity,
        capacityUtilization: Math.round(capacityUtilization * 100),
        bookingCount: roomBookingCount,
        recommendation: getRecommendationReason(room, capacity, attendees, roomBookingCount)
      };
    });

    // Sort by score (highest first)
    scoredRooms.sort((a, b) => b.score - a.score);

    return scoredRooms;
  },

  /**
   * Get recommended rooms with real-time availability check
   */
  getRecommendedRoomsRealtime: async (criteria) => {
    return roomRecommendationService.getRecommendedRooms(criteria);
  }
};

/**
 * Calculate distance between two rooms (Euclidean distance)
 */
function calculateDistance(room1, room2) {
  const dx = room1.x - room2.x;
  const dy = room1.y - room2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Generate human-readable recommendation reason
 */
function getRecommendationReason(room, capacity, attendees, bookingCount) {
  const reasons = [];

  const utilization = attendees / capacity;

  if (utilization >= 0.6 && utilization <= 0.9) {
    reasons.push('Perfect size match');
  } else if (utilization >= 0.9) {
    reasons.push('Maximum capacity utilization');
  }

  if (bookingCount > 0) {
    reasons.push(`You've booked this ${bookingCount} time${bookingCount > 1 ? 's' : ''} before`);
  }

  if (room.type === 'conference_room' && attendees > 15) {
    reasons.push('Large conference room for big meetings');
  } else if (room.type === 'meeting_room' && attendees <= 6) {
    reasons.push('Cozy meeting room for small teams');
  }

  return reasons.length > 0 ? reasons.join(' • ') : 'Available and suitable';
}

module.exports = roomRecommendationService;
