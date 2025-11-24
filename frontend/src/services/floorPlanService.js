import api from './api';

const floorPlanService = {
  // Get all floor plans
  getAll: async () => {
    const response = await api.get('/floor-plans');
    return response.data;
  },

  // Get floor plan by ID
  getById: async (id) => {
    const response = await api.get(`/floor-plans/${id}`);
    return response.data;
  },

  // Get user's floor plans
  getMyPlans: async () => {
    const response = await api.get('/floor-plans/my-plans');
    return response.data;
  },

  // Create floor plan
  create: async (planData) => {
    const response = await api.post('/floor-plans', planData);
    return response.data;
  },

  // Update floor plan
  update: async (id, planData) => {
    const response = await api.put(`/floor-plans/${id}`, planData);
    return response.data;
  },

  // Delete floor plan
  delete: async (id) => {
    const response = await api.delete(`/floor-plans/${id}`);
    return response.data;
  },

  // Publish floor plan
  publish: async (id) => {
    const response = await api.post(`/floor-plans/${id}/publish`);
    return response.data;
  },

  // Unpublish floor plan
  unpublish: async (id) => {
    const response = await api.post(`/floor-plans/${id}/unpublish`);
    return response.data;
  }
};

export default floorPlanService;
