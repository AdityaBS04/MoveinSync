const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Initialize activity_logs table
db.exec(`
  CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_email TEXT,
    user_name TEXT,
    action_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    entity_name TEXT,
    description TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    user_agent TEXT,
    is_online BOOLEAN DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// Create indexes for efficient querying
db.exec(`CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_logs(user_id)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_activity_type ON activity_logs(action_type)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_activity_entity ON activity_logs(entity_type, entity_id)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_activity_date ON activity_logs(created_at)`);

/**
 * Activity Log Model
 *
 * Action Types:
 * - AUTH: login, logout, signup
 * - FLOOR_PLAN: create, update, delete, publish, unpublish
 * - BOOKING: create, update, cancel
 * - VERSION: create, merge, reject, auto_merge
 * - SYNC: offline_save, online_sync
 *
 * Entity Types:
 * - user, floor_plan, booking, version
 */

const activityLogModel = {
  /**
   * Create a new activity log entry
   */
  create: (logData) => {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO activity_logs (
        id, user_id, user_email, user_name, action_type, entity_type,
        entity_id, entity_name, description, details, ip_address,
        user_agent, is_online
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Convert isOnline to integer (0 or 1) for SQLite
    const isOnline = logData.isOnline !== undefined ? (logData.isOnline ? 1 : 0) : 1;

    stmt.run(
      id,
      logData.userId,
      logData.userEmail || null,
      logData.userName || null,
      logData.actionType,
      logData.entityType,
      logData.entityId || null,
      logData.entityName || null,
      logData.description,
      logData.details ? JSON.stringify(logData.details) : null,
      logData.ipAddress || null,
      logData.userAgent || null,
      isOnline
    );

    return activityLogModel.findById(id);
  },

  /**
   * Find activity log by ID
   */
  findById: (id) => {
    const stmt = db.prepare('SELECT * FROM activity_logs WHERE id = ?');
    const log = stmt.get(id);
    if (log && log.details) {
      log.details = JSON.parse(log.details);
    }
    return log;
  },

  /**
   * Get all activity logs with filters
   */
  findAll: (filters = {}) => {
    let query = 'SELECT * FROM activity_logs WHERE 1=1';
    const params = [];

    if (filters.userId) {
      query += ' AND user_id = ?';
      params.push(filters.userId);
    }

    if (filters.actionType) {
      query += ' AND action_type = ?';
      params.push(filters.actionType);
    }

    if (filters.entityType) {
      query += ' AND entity_type = ?';
      params.push(filters.entityType);
    }

    if (filters.entityId) {
      query += ' AND entity_id = ?';
      params.push(filters.entityId);
    }

    if (filters.startDate) {
      query += ' AND created_at >= ?';
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ' AND created_at <= ?';
      params.push(filters.endDate);
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    const stmt = db.prepare(query);
    const logs = stmt.all(...params);

    return logs.map(log => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null
    }));
  },

  /**
   * Get activity statistics
   */
  getStats: (filters = {}) => {
    let query = `
      SELECT
        action_type,
        entity_type,
        COUNT(*) as count
      FROM activity_logs
      WHERE 1=1
    `;
    const params = [];

    if (filters.startDate) {
      query += ' AND created_at >= ?';
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ' AND created_at <= ?';
      params.push(filters.endDate);
    }

    query += ' GROUP BY action_type, entity_type';

    const stmt = db.prepare(query);
    return stmt.all(...params);
  },

  /**
   * Get recent activities for a user
   */
  findByUser: (userId, limit = 50) => {
    const stmt = db.prepare(`
      SELECT * FROM activity_logs
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);

    const logs = stmt.all(userId, limit);
    return logs.map(log => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null
    }));
  },

  /**
   * Get activities for a specific entity
   */
  findByEntity: (entityType, entityId, limit = 50) => {
    const stmt = db.prepare(`
      SELECT * FROM activity_logs
      WHERE entity_type = ? AND entity_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);

    const logs = stmt.all(entityType, entityId, limit);
    return logs.map(log => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null
    }));
  },

  /**
   * Delete old logs (cleanup)
   */
  deleteOlderThan: (days) => {
    const stmt = db.prepare(`
      DELETE FROM activity_logs
      WHERE created_at < datetime('now', '-' || ? || ' days')
    `);
    const info = stmt.run(days);
    return info.changes;
  }
};

module.exports = activityLogModel;
