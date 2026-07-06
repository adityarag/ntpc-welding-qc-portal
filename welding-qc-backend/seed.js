require('dotenv').config();
const { sequelize, User } = require('./models');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');
    
    // Sync to make sure table exists
    await sequelize.sync();
    
    const userCount = await User.count();
    if (userCount === 0) {
      const password_hash = bcrypt.hashSync('password123', 8);
      await User.bulkCreate([
        { username: 'admin', password_hash, role: 3 },
        { username: 'verifier', password_hash, role: 2 },
        { username: 'supervisor', password_hash, role: 1 }
      ]);
      console.log('Users seeded successfully! You can now log in.');
    } else {
      console.log('Users are already seeded.');
    }
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    process.exit(0);
  }
}

seed();
