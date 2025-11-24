import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const bookingService = {
  // Get all bookings (admin only)
  getAll: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/bookings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Get all bookings for the current user
  getMyBookings: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/bookings/my-bookings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Get bookings for a specific floor plan
  getByFloorPlan: async (floorPlanId) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/bookings/floor-plan/${floorPlanId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Get bookings for a specific room
  getByRoom: async (floorPlanId, roomId) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/bookings/floor-plan/${floorPlanId}/room/${roomId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Create a new booking
  create: async (bookingData) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/bookings`, bookingData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Update a booking
  update: async (bookingId, bookingData) => {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${API_URL}/bookings/${bookingId}`, bookingData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Cancel a booking
  cancel: async (bookingId) => {
    const token = localStorage.getItem('token');
    const response = await axios.patch(`${API_URL}/bookings/${bookingId}/cancel`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Delete a booking
  delete: async (bookingId) => {
    const token = localStorage.getItem('token');
    const response = await axios.delete(`${API_URL}/bookings/${bookingId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};

export default bookingService;
