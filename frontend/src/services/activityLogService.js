import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const activityLogService = {
  // Get all activity logs with filters
  getAll: async (filters = {}) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams(filters).toString();
      const response = await axios.get(
        `${API_URL}/activity-logs${params ? '?' + params : ''}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      throw error;
    }
  },

  // Get activity statistics
  getStats: async (startDate = null, endDate = null) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await axios.get(
        `${API_URL}/activity-logs/stats${params.toString() ? '?' + params.toString() : ''}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching activity stats:', error);
      throw error;
    }
  },

  // Get current user's activities
  getMyActivities: async (limit = 50) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/activity-logs/me?limit=${limit}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching my activities:', error);
      throw error;
    }
  },

  // Get user's activity history
  getUserActivities: async (userId, limit = 50) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/activity-logs/user/${userId}?limit=${limit}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching user activities:', error);
      throw error;
    }
  },

  // Get entity's activity history
  getEntityActivities: async (entityType, entityId, limit = 50) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/activity-logs/entity/${entityType}/${entityId}?limit=${limit}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching entity activities:', error);
      throw error;
    }
  }
};

export default activityLogService;
