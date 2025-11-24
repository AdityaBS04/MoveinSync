const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Initialize floor plans table
db.exec(`
  CREATE TABLE IF NOT EXISTS floor_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    building_name TEXT,
    floor_number INTEGER,
    canvas_width INTEGER DEFAULT 1200,
    canvas_height INTEGER DEFAULT 800,
    rooms TEXT,
    created_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (created_by) REFERENCES users(id)
  )
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_floor_plans_created_by ON floor_plans(created_by)
`);

const floorPlanModel = {
  // Find all floor plans (with optional status filter and role-based filtering)
  findAll: (userRole = null) => {
    let query = 'SELECT * FROM floor_plans';

    // Regular users only see published plans, admins see all
    if (userRole && userRole !== 'admin') {
      query += " WHERE status = 'published'";
    }

    query += ' ORDER BY created_at DESC';

    const stmt = db.prepare(query);
    const plans = stmt.all();
    return plans.map(plan => ({
      ...plan,
      rooms: JSON.parse(plan.rooms || '[]')
    }));
  },

  // Find only published floor plans
  findPublished: () => {
    const stmt = db.prepare("SELECT * FROM floor_plans WHERE status = 'published' ORDER BY created_at DESC");
    const plans = stmt.all();
    return plans.map(plan => ({
      ...plan,
      rooms: JSON.parse(plan.rooms || '[]')
    }));
  },

  // Find only draft floor plans (admin only)
  findDrafts: () => {
    const stmt = db.prepare("SELECT * FROM floor_plans WHERE status = 'draft' ORDER BY created_at DESC");
    const plans = stmt.all();
    return plans.map(plan => ({
      ...plan,
      rooms: JSON.parse(plan.rooms || '[]')
    }));
  },

  // Find floor plan by ID
  findById: (id) => {
    const stmt = db.prepare('SELECT * FROM floor_plans WHERE id = ?');
    const plan = stmt.get(id);
    if (plan) {
      plan.rooms = JSON.parse(plan.rooms || '[]');
    }
    return plan;
  },

  // Find floor plans by user
  findByUser: (userId) => {
    const stmt = db.prepare('SELECT * FROM floor_plans WHERE created_by = ? ORDER BY created_at DESC');
    const plans = stmt.all(userId);
    return plans.map(plan => ({
      ...plan,
      rooms: JSON.parse(plan.rooms || '[]')
    }));
  },

  // Create new floor plan
  create: (planData) => {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO floor_plans (
        id, name, building_name, floor_number,
        canvas_width, canvas_height, rooms, created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      planData.name,
      planData.buildingName || null,
      planData.floorNumber || null,
      planData.canvasWidth || 1200,
      planData.canvasHeight || 800,
      JSON.stringify(planData.rooms || []),
      planData.createdBy
    );

    return floorPlanModel.findById(id);
  },

  // Update floor plan
  update: (id, planData) => {
    const updates = [];
    const values = [];

    if (planData.name !== undefined) {
      updates.push('name = ?');
      values.push(planData.name);
    }
    if (planData.buildingName !== undefined) {
      updates.push('building_name = ?');
      values.push(planData.buildingName);
    }
    if (planData.floorNumber !== undefined) {
      updates.push('floor_number = ?');
      values.push(planData.floorNumber);
    }
    if (planData.rooms !== undefined) {
      updates.push('rooms = ?');
      values.push(JSON.stringify(planData.rooms));
    }

    updates.push("updated_at = datetime('now')");
    values.push(id);

    const stmt = db.prepare(`
      UPDATE floor_plans
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values);
    return floorPlanModel.findById(id);
  },

  // Delete floor plan (with validation)
  delete: (id) => {
    // Check if there are any bookings for this floor plan
    const bookingCheckStmt = db.prepare('SELECT COUNT(*) as count FROM bookings WHERE floor_plan_id = ?');
    const bookingCount = bookingCheckStmt.get(id);

    if (bookingCount && bookingCount.count > 0) {
      throw new Error(`Cannot delete floor plan. There are ${bookingCount.count} active booking(s) associated with it. Please cancel all bookings first.`);
    }

    // If no bookings, proceed with deletion
    const transaction = db.transaction(() => {
      // Delete all versions for this floor plan
      const deleteVersionsStmt = db.prepare('DELETE FROM floor_plan_versions WHERE floor_plan_id = ?');
      deleteVersionsStmt.run(id);

      // Delete the floor plan itself
      const deleteFloorPlanStmt = db.prepare('DELETE FROM floor_plans WHERE id = ?');
      const info = deleteFloorPlanStmt.run(id);

      return info.changes > 0;
    });

    return transaction();
  },

  // Publish a floor plan (change status from draft to published)
  publish: (id) => {
    const stmt = db.prepare(`
      UPDATE floor_plans
      SET status = 'published',
          updated_at = datetime('now')
      WHERE id = ?
    `);
    stmt.run(id);
    return floorPlanModel.findById(id);
  },

  // Unpublish a floor plan (change status from published to draft)
  unpublish: (id) => {
    const stmt = db.prepare(`
      UPDATE floor_plans
      SET status = 'draft',
          updated_at = datetime('now')
      WHERE id = ?
    `);
    stmt.run(id);
    return floorPlanModel.findById(id);
  }
};

module.exports = floorPlanModel;
