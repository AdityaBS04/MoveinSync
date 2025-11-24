const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const floorPlanVersionModel = {
  // Create a new version
  create: (versionData) => {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO floor_plan_versions (
        id, floor_plan_id, version, name, rooms, status,
        created_by, change_description
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      versionData.floorPlanId,
      versionData.version,
      versionData.name,
      JSON.stringify(versionData.rooms || []),
      versionData.status || 'draft',
      versionData.createdBy,
      versionData.changeDescription || null
    );

    return floorPlanVersionModel.findById(id);
  },

  // Find version by ID
  findById: (id) => {
    const stmt = db.prepare('SELECT * FROM floor_plan_versions WHERE id = ?');
    const version = stmt.get(id);
    if (version) {
      version.rooms = JSON.parse(version.rooms || '[]');
    }
    return version;
  },

  // Get all versions for a floor plan
  findByFloorPlanId: (floorPlanId) => {
    const stmt = db.prepare(`
      SELECT v.*, u.full_name as creator_name, u.priority as creator_priority
      FROM floor_plan_versions v
      LEFT JOIN users u ON v.created_by = u.id
      WHERE v.floor_plan_id = ?
      ORDER BY v.version DESC, v.created_at DESC
    `);
    const versions = stmt.all(floorPlanId);
    return versions.map(v => ({
      ...v,
      rooms: JSON.parse(v.rooms || '[]')
    }));
  },

  // Get pending (draft) versions for a floor plan
  getPendingVersions: (floorPlanId) => {
    const stmt = db.prepare(`
      SELECT v.*, u.full_name as creator_name, u.priority as creator_priority
      FROM floor_plan_versions v
      LEFT JOIN users u ON v.created_by = u.id
      WHERE v.floor_plan_id = ? AND v.status = 'draft'
      ORDER BY u.priority ASC, v.created_at ASC
    `);
    const versions = stmt.all(floorPlanId);
    return versions.map(v => ({
      ...v,
      rooms: JSON.parse(v.rooms || '[]')
    }));
  },

  // Merge a version (publish it)
  merge: (versionId, mergedBy) => {
    const stmt = db.prepare(`
      UPDATE floor_plan_versions
      SET status = 'merged',
          merged_at = datetime('now'),
          merged_by = ?
      WHERE id = ?
    `);

    stmt.run(mergedBy, versionId);
    return floorPlanVersionModel.findById(versionId);
  },

  // Reject a version
  reject: (versionId, rejectedBy) => {
    const stmt = db.prepare(`
      UPDATE floor_plan_versions
      SET status = 'rejected',
          merged_at = datetime('now'),
          merged_by = ?
      WHERE id = ?
    `);

    stmt.run(rejectedBy, versionId);
    return floorPlanVersionModel.findById(versionId);
  },

  // Delete a version
  delete: (id) => {
    const stmt = db.prepare('DELETE FROM floor_plan_versions WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }
};

module.exports = floorPlanVersionModel;
