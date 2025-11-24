const floorPlanModel = require('../models/floorPlanModel');
const floorPlanVersionModel = require('../models/floorPlanVersionModel');
const logger = require('../utils/logger');

const floorPlanController = {
  // Get all floor plans (filtered by user role)
  getAll: (req, res) => {
    try {
      // Pass user role to filter: admins see all, users see only published
      const plans = floorPlanModel.findAll(req.user?.role);

      // For admins, add pending version counts
      if (req.user?.role === 'admin') {
        plans.forEach(plan => {
          const pendingVersions = floorPlanVersionModel.getPendingVersions(plan.id);
          plan.pending_versions_count = pendingVersions.length;
          plan.has_pending_versions = pendingVersions.length > 0;
        });
      }

      res.json({
        success: true,
        plans
      });
    } catch (error) {
      console.error('Get all floor plans error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  // Get floor plan by ID
  getById: (req, res) => {
    try {
      const { id } = req.params;
      const plan = floorPlanModel.findById(id);

      if (!plan) {
        return res.status(404).json({
          success: false,
          message: 'Floor plan not found'
        });
      }

      res.json({
        success: true,
        plan
      });
    } catch (error) {
      console.error('Get floor plan error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  // Get user's floor plans
  getMyPlans: (req, res) => {
    try {
      const plans = floorPlanModel.findByUser(req.user.userId);
      res.json({
        success: true,
        plans
      });
    } catch (error) {
      console.error('Get my plans error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  // Create floor plan
  create: (req, res) => {
    try {
      const { name, buildingName, floorNumber, canvasWidth, canvasHeight, rooms } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a name for the floor plan'
        });
      }

      const plan = floorPlanModel.create({
        name,
        buildingName,
        floorNumber,
        canvasWidth,
        canvasHeight,
        rooms: rooms || [],
        createdBy: req.user.userId
      });

      // Log floor plan creation
      logger.logFloorPlan(req.user, 'create', plan, req);

      res.status(201).json({
        success: true,
        message: 'Floor plan created successfully',
        plan
      });
    } catch (error) {
      console.error('Create floor plan error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  // Update floor plan
  update: (req, res) => {
    try {
      const { id } = req.params;
      const { name, buildingName, floorNumber, rooms, changeDescription } = req.body;

      const existingPlan = floorPlanModel.findById(id);
      if (!existingPlan) {
        return res.status(404).json({
          success: false,
          message: 'Floor plan not found'
        });
      }

      // Check ownership (only creator or admin can update)
      if (existingPlan.created_by !== req.user.userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this floor plan'
        });
      }

      // PUBLISHED floor plans: Create version instead of direct update
      if (existingPlan.status === 'published') {
        const version = floorPlanVersionModel.create({
          floorPlanId: id,
          version: existingPlan.version + 1,
          name: name || existingPlan.name,
          rooms: rooms || existingPlan.rooms,
          status: 'draft',
          createdBy: req.user.userId,
          changeDescription: changeDescription || 'Floor plan updates'
        });

        // Log version creation
        logger.logVersion(req.user, 'create', version, existingPlan, req);

        return res.json({
          success: true,
          message: 'Changes submitted for review. Head user will merge after review.',
          versionCreated: true,
          requiresReview: true,
          version
        });
      }

      // DRAFT floor plans: Allow direct update (collaborative editing)
      const plan = floorPlanModel.update(id, {
        name,
        buildingName,
        floorNumber,
        rooms
      });

      // Log floor plan update
      logger.logFloorPlan(req.user, 'update', plan, req);

      res.json({
        success: true,
        message: 'Floor plan updated successfully',
        plan
      });
    } catch (error) {
      console.error('Update floor plan error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  // Delete floor plan
  delete: (req, res) => {
    try {
      const { id } = req.params;

      const existingPlan = floorPlanModel.findById(id);
      if (!existingPlan) {
        return res.status(404).json({
          success: false,
          message: 'Floor plan not found'
        });
      }

      // Check ownership (only creator or admin can delete)
      if (existingPlan.created_by !== req.user.userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this floor plan'
        });
      }

      floorPlanModel.delete(id);

      // Log floor plan deletion
      logger.logFloorPlan(req.user, 'delete', existingPlan, req);

      res.json({
        success: true,
        message: 'Floor plan deleted successfully'
      });
    } catch (error) {
      console.error('Delete floor plan error:', error);

      // Check if it's a booking constraint error
      if (error.message && error.message.includes('Cannot delete floor plan')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  // Publish a floor plan (admin only)
  publish: (req, res) => {
    try {
      const { id } = req.params;

      // Only admins can publish
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can publish floor plans'
        });
      }

      const existingPlan = floorPlanModel.findById(id);
      if (!existingPlan) {
        return res.status(404).json({
          success: false,
          message: 'Floor plan not found'
        });
      }

      if (existingPlan.status === 'published') {
        return res.status(400).json({
          success: false,
          message: 'Floor plan is already published'
        });
      }

      const plan = floorPlanModel.publish(id);

      // Log floor plan publish
      logger.logFloorPlan(req.user, 'publish', plan, req);

      res.json({
        success: true,
        message: 'Floor plan published successfully',
        plan
      });
    } catch (error) {
      console.error('Publish floor plan error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  // Unpublish a floor plan (admin only)
  unpublish: (req, res) => {
    try {
      const { id } = req.params;

      // Only admins can unpublish
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can unpublish floor plans'
        });
      }

      const existingPlan = floorPlanModel.findById(id);
      if (!existingPlan) {
        return res.status(404).json({
          success: false,
          message: 'Floor plan not found'
        });
      }

      if (existingPlan.status === 'draft') {
        return res.status(400).json({
          success: false,
          message: 'Floor plan is already a draft'
        });
      }

      const plan = floorPlanModel.unpublish(id);

      // Log floor plan unpublish
      logger.logFloorPlan(req.user, 'unpublish', plan, req);

      res.json({
        success: true,
        message: 'Floor plan unpublished successfully',
        plan
      });
    } catch (error) {
      console.error('Unpublish floor plan error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
};

module.exports = floorPlanController;
