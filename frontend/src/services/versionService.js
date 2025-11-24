import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const versionService = {
  // Get all versions for a floor plan
  getVersions: async (floorPlanId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/versions/floor-plan/${floorPlanId}/versions`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching versions:', error);
      throw error;
    }
  },

  // Get pending versions for a floor plan
  getPendingVersions: async (floorPlanId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/versions/floor-plan/${floorPlanId}/pending`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching pending versions:', error);
      throw error;
    }
  },

  // Analyze conflicts for a floor plan
  analyzeConflicts: async (floorPlanId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/versions/floor-plan/${floorPlanId}/analyze`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error analyzing conflicts:', error);
      throw error;
    }
  },

  // Auto-merge all pending versions
  autoMerge: async (floorPlanId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/versions/floor-plan/${floorPlanId}/auto-merge`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error auto-merging versions:', error);
      throw error;
    }
  },

  // Compare two versions
  compareVersions: async (versionId1, versionId2) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/versions/compare?versionId1=${versionId1}&versionId2=${versionId2}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error comparing versions:', error);
      throw error;
    }
  },

  // Merge a specific version (head user only)
  mergeVersion: async (versionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/versions/${versionId}/merge`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error merging version:', error);
      throw error;
    }
  },

  // Reject a version (head user only)
  rejectVersion: async (versionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/versions/${versionId}/reject`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error rejecting version:', error);
      throw error;
    }
  }
};

export default versionService;
