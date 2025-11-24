require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Check if users already exist
    const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();

    if (existingUsers.count > 0) {
      console.log('⚠️  Users already exist. Skipping seed.');
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const stmt = db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, role, department)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    // Demo users to create
    const demoUsers = [
      {
        email: 'admin@movensync.com',
        password: 'admin123',
        fullName: 'Admin User',
        role: 'admin',
        department: 'Administration'
      },
      {
        email: 'user@movensync.com',
        password: 'user123',
        fullName: 'Regular User',
        role: 'user',
        department: 'General'
      }
    ];

    console.log('');
    console.log('👥 Creating demo users...');
    console.log('');

    for (const user of demoUsers) {
      // Generate fresh salt and hash for each user
      const userSalt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(user.password, userSalt);
      const userId = uuidv4();

      stmt.run(
        userId,
        user.email,
        passwordHash,
        user.fullName,
        user.role,
        user.department
      );

      console.log(`✅ ${user.fullName} created`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🔑 Password: ${user.password}`);
      console.log(`   👤 Role: ${user.role}`);
      console.log('');
    }

    console.log('🎉 All demo users created successfully!');
    console.log('');
    console.log('⚠️  Please change these passwords after first login!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seed if executed directly
if (require.main === module) {
  seedDatabase().then(() => {
    console.log('🎉 Database seeding completed!');
    process.exit(0);
  });
}

module.exports = seedDatabase;
