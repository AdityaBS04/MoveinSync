const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const userModel = {
  // Find all users
  findAll: () => {
    const stmt = db.prepare('SELECT id, email, full_name, role, department, created_at, last_login FROM users');
    return stmt.all();
  },

  // Find user by ID
  findById: (id) => {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  },

  // Find user by email
  findByEmail: (email) => {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  },

  // Create new user
  create: (userData) => {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, role, department)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      id,
      userData.email,
      userData.passwordHash,
      userData.fullName,
      userData.role || 'user',
      userData.department || null
    );

    if (info.changes > 0) {
      return userModel.findById(id);
    }
    return null;
  },

  // Update last login
  updateLastLogin: (id) => {
    const stmt = db.prepare(`
      UPDATE users
      SET last_login = datetime('now')
      WHERE id = ?
    `);
    stmt.run(id);
    return userModel.findById(id);
  },

  // Update user
  update: (id, userData) => {
    const fields = [];
    const values = [];

    if (userData.fullName) {
      fields.push('full_name = ?');
      values.push(userData.fullName);
    }
    if (userData.department) {
      fields.push('department = ?');
      values.push(userData.department);
    }
    if (userData.role) {
      fields.push('role = ?');
      values.push(userData.role);
    }

    fields.push("updated_at = datetime('now')");
    values.push(id);

    const stmt = db.prepare(`
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = ?
    `);
    stmt.run(...values);
    return userModel.findById(id);
  },

  // Delete user
  delete: (id) => {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  },

  // Count users
  count: () => {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM users');
    return stmt.get().count;
  },

  // Check if any users exist
  hasUsers: () => {
    return userModel.count() > 0;
  }
};

module.exports = userModel;
