const activityLogModel = require('../models/activityLogModel');

/**
 * Activity Logger Utility
 * Provides helper functions for logging various activities
 */

const logger = {
  /**
   * Log user authentication activities
   */
  logAuth: (user, action, req = null, details = {}) => {
    return activityLogModel.create({
      userId: user.id || user.userId,
      userEmail: user.email,
      userName: user.fullName || user.full_name,
      actionType: `AUTH_${action.toUpperCase()}`,
      entityType: 'user',
      entityId: user.id || user.userId,
      entityName: user.email,
      description: `User ${action}`,
      details,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.headers?.['user-agent'],
      isOnline: true
    });
  },

  /**
   * Log floor plan activities
   */
  logFloorPlan: (user, action, floorPlan, req = null, details = {}) => {
    const actionDescriptions = {
      create: 'created a new floor plan',
      update: 'updated floor plan',
      delete: 'deleted floor plan',
      publish: 'published floor plan',
      unpublish: 'unpublished floor plan',
      offline_save: 'saved floor plan offline',
      online_sync: 'synced floor plan changes online'
    };

    return activityLogModel.create({
      userId: user.id || user.userId,
      userEmail: user.email,
      userName: user.fullName || user.full_name,
      actionType: `FLOOR_PLAN_${action.toUpperCase()}`,
      entityType: 'floor_plan',
      entityId: floorPlan.id,
      entityName: floorPlan.name,
      description: `${user.fullName || user.full_name} ${actionDescriptions[action] || action} "${floorPlan.name}"`,
      details: {
        ...details,
        floorPlanId: floorPlan.id,
        status: floorPlan.status,
        roomCount: floorPlan.rooms?.length || 0
      },
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.headers?.['user-agent'],
      isOnline: details.isOnline !== undefined ? details.isOnline : true
    });
  },

  /**
   * Log booking activities
   */
  logBooking: (user, action, booking, req = null, details = {}) => {
    const actionDescriptions = {
      create: 'created a new booking',
      update: 'updated booking',
      cancel: 'cancelled booking',
      complete: 'completed booking'
    };

    return activityLogModel.create({
      userId: user.id || user.userId,
      userEmail: user.email,
      userName: user.fullName || user.full_name,
      actionType: `BOOKING_${action.toUpperCase()}`,
      entityType: 'booking',
      entityId: booking.id,
      entityName: booking.title || booking.room_name,
      description: `${user.fullName || user.full_name} ${actionDescriptions[action] || action} for ${booking.room_name}`,
      details: {
        ...details,
        bookingId: booking.id,
        roomName: booking.room_name,
        startTime: booking.start_time,
        endTime: booking.end_time,
        status: booking.status
      },
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.headers?.['user-agent'],
      isOnline: true
    });
  },

  /**
   * Log version control activities
   */
  logVersion: (user, action, version, floorPlan, req = null, details = {}) => {
    const actionDescriptions = {
      create: 'created a version',
      merge: 'merged a version',
      reject: 'rejected a version',
      auto_merge: 'auto-merged versions'
    };

    return activityLogModel.create({
      userId: user.id || user.userId,
      userEmail: user.email,
      userName: user.fullName || user.full_name,
      actionType: `VERSION_${action.toUpperCase()}`,
      entityType: 'version',
      entityId: version.id,
      entityName: `${floorPlan.name} v${version.version}`,
      description: `${user.fullName || user.full_name} ${actionDescriptions[action] || action} for "${floorPlan.name}"`,
      details: {
        ...details,
        versionId: version.id,
        versionNumber: version.version,
        floorPlanId: floorPlan.id,
        floorPlanName: floorPlan.name,
        status: version.status,
        priority: user.priority
      },
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.headers?.['user-agent'],
      isOnline: true
    });
  },

  /**
   * Log sync activities
   */
  logSync: (user, action, entityType, entityData, details = {}) => {
    const actionDescriptions = {
      offline_save: 'saved changes offline',
      online_sync: 'synced changes online',
      conflict_detected: 'conflict detected during sync',
      sync_failed: 'sync failed'
    };

    return activityLogModel.create({
      userId: user.id || user.userId,
      userEmail: user.email,
      userName: user.fullName || user.full_name,
      actionType: `SYNC_${action.toUpperCase()}`,
      entityType,
      entityId: entityData.id,
      entityName: entityData.name || entityData.title,
      description: `${user.fullName || user.full_name} ${actionDescriptions[action] || action}`,
      details,
      ipAddress: null,
      userAgent: null,
      isOnline: action === 'online_sync' || action === 'sync_failed'
    });
  },

  /**
   * Generic log function
   */
  log: (logData) => {
    return activityLogModel.create(logData);
  }
};

module.exports = logger;
