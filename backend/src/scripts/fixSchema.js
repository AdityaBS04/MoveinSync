require('dotenv').config();
const db = require('../config/database');

console.log('🔍 Checking current floor_plans schema...\n');

// Get the current schema
const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='floor_plans'").get();
console.log('Current floor_plans schema:');
console.log(schema.sql);
console.log('\n');

// Check if status column exists and what constraint it has
const tableInfo = db.prepare("PRAGMA table_info(floor_plans)").all();
console.log('Floor_plans columns:');
tableInfo.forEach(col => {
  console.log(`  - ${col.name}: ${col.type} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
});

console.log('\n✅ Schema check complete!');
process.exit(0);
