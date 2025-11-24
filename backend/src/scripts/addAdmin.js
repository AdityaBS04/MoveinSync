require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const addAdminUser = async () => {
  try {
    console.log('👥 Adding second admin user...\n');

    const newAdmin = {
      email: 'admin2@movensync.com',
      password: 'admin123',
      fullName: 'Admin User 2',
      role: 'admin',
      department: 'Administration',
      priority: 50 // Lower priority than head user (1) but still an admin
    };

    // Check if user already exists
    const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(newAdmin.email);

    if (existing) {
      console.log('⚠️  User already exists with email:', newAdmin.email);
      console.log('   📧 Email:', newAdmin.email);
      console.log('   🔑 Password: admin123');
      console.log('   👤 Role:', existing.role);
      console.log('   ⚡ Priority:', existing.priority);
      return;
    }

    // Generate hash
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newAdmin.password, salt);
    const userId = uuidv4();

    // Insert user
    const stmt = db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, role, department, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      userId,
      newAdmin.email,
      passwordHash,
      newAdmin.fullName,
      newAdmin.role,
      newAdmin.department,
      newAdmin.priority
    );

    console.log('✅ Second admin user created successfully!\n');
    console.log('   📧 Email:', newAdmin.email);
    console.log('   🔑 Password:', newAdmin.password);
    console.log('   👤 Role:', newAdmin.role);
    console.log('   ⚡ Priority:', newAdmin.priority);
    console.log('\n💡 Use this login to test version creation as a lower-priority admin');
    console.log('   The head user (admin@movensync.com with priority 1) can merge versions\n');

  } catch (error) {
    console.error('❌ Error adding admin user:', error);
    process.exit(1);
  }
};

addAdminUser().then(() => {
  console.log('🎉 Done!');
  process.exit(0);
});
