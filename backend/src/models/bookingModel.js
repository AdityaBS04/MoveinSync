const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Initialize bookings table
db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    floor_plan_id TEXT NOT NULL,
    room_id TEXT NOT NULL,
    room_name TEXT NOT NULL,
    user_id TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    attendees INTEGER DEFAULT 1,
    status TEXT DEFAULT 'confirmed' CHECK(status IN ('confirmed', 'cancelled', 'completed')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (floor_plan_id) REFERENCES floor_plans(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_bookings_floor_plan ON bookings(floor_plan_id)
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id)
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_bookings_time ON bookings(start_time, end_time)
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)
`);

const bookingModel = {
  // Find all bookings (optimized with JOIN to include user names)
  findAll: () => {
    const stmt = db.prepare(`
      SELECT
        bookings.*,
        users.full_name as user_name
      FROM bookings
      LEFT JOIN users ON bookings.user_id = users.id
      ORDER BY bookings.start_time DESC
    `);
    return stmt.all();
  },

  // Find booking by ID
  findById: (id) => {
    const stmt = db.prepare('SELECT * FROM bookings WHERE id = ?');
    return stmt.get(id);
  },

  // Find bookings by user
  findByUser: (userId) => {
    const stmt = db.prepare('SELECT * FROM bookings WHERE user_id = ? ORDER BY start_time DESC');
    return stmt.all(userId);
  },

  // Find bookings by floor plan
  findByFloorPlan: (floorPlanId) => {
    const stmt = db.prepare('SELECT * FROM bookings WHERE floor_plan_id = ? ORDER BY start_time ASC');
    return stmt.all(floorPlanId);
  },

  // Find bookings for a specific room
  findByRoom: (floorPlanId, roomId) => {
    const stmt = db.prepare(`
      SELECT * FROM bookings
      WHERE floor_plan_id = ? AND room_id = ?
      ORDER BY start_time ASC
    `);
    return stmt.all(floorPlanId, roomId);
  },

  // Check room availability
  isRoomAvailable: (floorPlanId, roomId, startTime, endTime, excludeBookingId = null) => {
    let query = `
      SELECT COUNT(*) as count
      FROM bookings
      WHERE floor_plan_id = ?
        AND room_id = ?
        AND status = 'confirmed'
        AND (
          (start_time < ? AND end_time > ?) OR
          (start_time < ? AND end_time > ?) OR
          (start_time >= ? AND end_time <= ?)
        )
    `;

    const params = [floorPlanId, roomId, endTime, startTime, endTime, startTime, startTime, endTime];

    if (excludeBookingId) {
      query += ' AND id != ?';
      params.push(excludeBookingId);
    }

    const stmt = db.prepare(query);
    const result = stmt.get(...params);
    return result.count === 0;
  },

  // Create booking
  create: (bookingData) => {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO bookings (
        id, floor_plan_id, room_id, room_name, user_id,
        start_time, end_time, title, description, attendees
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      bookingData.floorPlanId,
      bookingData.roomId,
      bookingData.roomName,
      bookingData.userId,
      bookingData.startTime,
      bookingData.endTime,
      bookingData.title,
      bookingData.description || null,
      bookingData.attendees || 1
    );

    return bookingModel.findById(id);
  },

  // Update booking
  update: (id, bookingData) => {
    const updates = [];
    const values = [];

    if (bookingData.startTime !== undefined) {
      updates.push('start_time = ?');
      values.push(bookingData.startTime);
    }
    if (bookingData.endTime !== undefined) {
      updates.push('end_time = ?');
      values.push(bookingData.endTime);
    }
    if (bookingData.title !== undefined) {
      updates.push('title = ?');
      values.push(bookingData.title);
    }
    if (bookingData.description !== undefined) {
      updates.push('description = ?');
      values.push(bookingData.description);
    }
    if (bookingData.attendees !== undefined) {
      updates.push('attendees = ?');
      values.push(bookingData.attendees);
    }
    if (bookingData.status !== undefined) {
      updates.push('status = ?');
      values.push(bookingData.status);
    }

    updates.push("updated_at = datetime('now')");
    values.push(id);

    const stmt = db.prepare(`
      UPDATE bookings
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values);
    return bookingModel.findById(id);
  },

  // Cancel booking
  cancel: (id) => {
    return bookingModel.update(id, { status: 'cancelled' });
  },

  // Delete booking
  delete: (id) => {
    const stmt = db.prepare('DELETE FROM bookings WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }
};

module.exports = bookingModel;
