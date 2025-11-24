const db = require('../config/database');

/**
 * Migration: Add Version Control Features
 * - Adds priority to users
 * - Adds status, version fields to floor_plans
 * - Creates floor_plan_versions table
 */

const addVersionControl = () => {
  try {
    console.log('🔄 Running version control migration...');

    // 1. Add priority to users table (1 = highest priority/head user)
    try {
      db.exec(`ALTER TABLE users ADD COLUMN priority INTEGER DEFAULT 100`);
      console.log('✅ Added priority column to users table');
    } catch (error) {
      if (error.message.includes('duplicate column name')) {
        console.log('⚠️  Priority column already exists');
      } else {
        throw error;
      }
    }

    // 2. Add status and version to floor_plans table
    try {
      db.exec(`ALTER TABLE floor_plans ADD COLUMN status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published'))`);
      console.log('✅ Added status column to floor_plans table');
    } catch (error) {
      if (error.message.includes('duplicate column name')) {
        console.log('⚠️  Status column already exists');
      } else {
        throw error;
      }
    }

    try {
      db.exec(`ALTER TABLE floor_plans ADD COLUMN version INTEGER DEFAULT 1`);
      console.log('✅ Added version column to floor_plans table');
    } catch (error) {
      if (error.message.includes('duplicate column name')) {
        console.log('⚠️  Version column already exists');
      } else {
        throw error;
      }
    }

    try {
      db.exec(`ALTER TABLE floor_plans ADD COLUMN parent_version_id TEXT`);
      console.log('✅ Added parent_version_id column to floor_plans table');
    } catch (error) {
      if (error.message.includes('duplicate column name')) {
        console.log('⚠️  Parent_version_id column already exists');
      } else {
        throw error;
      }
    }

    // 3. Create floor_plan_versions table
    db.exec(`
      CREATE TABLE IF NOT EXISTS floor_plan_versions (
        id TEXT PRIMARY KEY,
        floor_plan_id TEXT NOT NULL,
        version INTEGER NOT NULL,
        name TEXT NOT NULL,
        rooms TEXT,
        status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'merged', 'rejected')),
        created_by TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        merged_at TEXT,
        merged_by TEXT,
        change_description TEXT,
        FOREIGN KEY (floor_plan_id) REFERENCES floor_plans(id),
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (merged_by) REFERENCES users(id)
      )
    `);
    console.log('✅ Created floor_plan_versions table');

    // Create indexes
    db.exec(`CREATE INDEX IF NOT EXISTS idx_versions_floor_plan ON floor_plan_versions(floor_plan_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_versions_created_by ON floor_plan_versions(created_by)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_users_priority ON users(priority)`);
    console.log('✅ Created indexes');

    // Set admin user as head user (priority 1)
    const adminStmt = db.prepare(`UPDATE users SET priority = 1 WHERE role = 'admin' AND email = 'admin@movensync.com'`);
    adminStmt.run();
    console.log('✅ Set admin as head user (priority 1)');

    console.log('🎉 Version control migration completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Run migration if executed directly
if (require.main === module) {
  addVersionControl();
  process.exit(0);
}

module.exports = addVersionControl;
