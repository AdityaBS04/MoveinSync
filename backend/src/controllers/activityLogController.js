const activityLogModel = require('../models/activityLogModel');

const activityLogController = {
  /**
   * Get all activity logs with filters
   * GET /api/activity-logs
   */
  getAll: (req, res) => {
    try {
      const { userId, actionType, entityType, entityId, startDate, endDate, limit } = req.query;

      const filters = {};
      if (userId) filters.userId = userId;
      if (actionType) filters.actionType = actionType;
      if (entityType) filters.entityType = entityType;
      if (entityId) filters.entityId = entityId;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (limit) filters.limit = parseInt(limit);

      const logs = activityLogModel.findAll(filters);

      res.json({
        success: true,
        logs,
        count: logs.length
      });
    } catch (error) {
      console.error('Get activity logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve activity logs'
      });
    }
  },

  /**
   * Get activity log by ID
   * GET /api/activity-logs/:id
   */
  getById: (req, res) => {
    try {
      const { id } = req.params;
      const log = activityLogModel.findById(id);

      if (!log) {
        return res.status(404).json({
          success: false,
          message: 'Activity log not found'
        });
      }

      res.json({
        success: true,
        log
      });
    } catch (error) {
      console.error('Get activity log error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve activity log'
      });
    }
  },

  /**
   * Get activity statistics
   * GET /api/activity-logs/stats
   */
  getStats: (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      const filters = {};
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const stats = activityLogModel.getStats(filters);

      // Calculate totals by action type
      const byActionType = {};
      const byEntityType = {};

      stats.forEach(stat => {
        if (!byActionType[stat.action_type]) {
          byActionType[stat.action_type] = 0;
        }
        byActionType[stat.action_type] += stat.count;

        if (!byEntityType[stat.entity_type]) {
          byEntityType[stat.entity_type] = 0;
        }
        byEntityType[stat.entity_type] += stat.count;
      });

      res.json({
        success: true,
        stats: {
          detailed: stats,
          byActionType,
          byEntityType,
          total: stats.reduce((sum, stat) => sum + stat.count, 0)
        }
      });
    } catch (error) {
      console.error('Get activity stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve activity statistics'
      });
    }
  },

  /**
   * Get user's activity history
   * GET /api/activity-logs/user/:userId
   */
  getUserActivities: (req, res) => {
    try {
      const { userId } = req.params;
      const { limit } = req.query;

      const logs = activityLogModel.findByUser(userId, limit ? parseInt(limit) : 50);

      res.json({
        success: true,
        logs,
        count: logs.length
      });
    } catch (error) {
      console.error('Get user activities error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user activities'
      });
    }
  },

  /**
   * Get entity's activity history
   * GET /api/activity-logs/entity/:entityType/:entityId
   */
  getEntityActivities: (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      const { limit } = req.query;

      const logs = activityLogModel.findByEntity(
        entityType,
        entityId,
        limit ? parseInt(limit) : 50
      );

      res.json({
        success: true,
        logs,
        count: logs.length
      });
    } catch (error) {
      console.error('Get entity activities error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve entity activities'
      });
    }
  },

  /**
   * Get current user's recent activities
   * GET /api/activity-logs/me
   */
  getMyActivities: (req, res) => {
    try {
      const { limit } = req.query;
      const logs = activityLogModel.findByUser(
        req.user.userId,
        limit ? parseInt(limit) : 50
      );

      res.json({
        success: true,
        logs,
        count: logs.length
      });
    } catch (error) {
      console.error('Get my activities error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve your activities'
      });
    }
  }
};

module.exports = activityLogController;
