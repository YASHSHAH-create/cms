require('dotenv').config();
const { connectMongo } = require('./config/mongo');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function seedUsers() {
  try {
    await connectMongo();
    console.log('Connected to MongoDB');

    // Create admin user
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      const adminPassword = await bcrypt.hash('admin123', 10);
      const admin = new User({
        username: 'admin',
        password: adminPassword,
        name: 'System Administrator',
        email: 'admin@envirocarelabs.com',
        role: 'admin'
      });
      await admin.save();
      console.log('✅ Admin user created: username=admin, password=admin123');
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    // Create executive user
    const execExists = await User.findOne({ username: 'executive' });
    if (!execExists) {
      const execPassword = await bcrypt.hash('exec123', 10);
      const executive = new User({
        username: 'executive',
        password: execPassword,
        name: 'Customer Experience Executive',
        email: 'executive@envirocarelabs.com',
        role: 'executive'
      });
      await executive.save();
      console.log('✅ Executive user created: username=executive, password=exec123');
    } else {
      console.log('ℹ️ Executive user already exists');
    }

    // Create demo executive
    const demoExists = await User.findOne({ username: 'demo' });
    if (!demoExists) {
      const demoPassword = await bcrypt.hash('demo123', 10);
      const demo = new User({
        username: 'demo',
        password: demoPassword,
        name: 'Demo Executive',
        email: 'demo@envirocarelabs.com',
        role: 'executive'
      });
      await demo.save();
      console.log('✅ Demo user created: username=demo, password=demo123');
    } else {
      console.log('ℹ️ Demo user already exists');
    }

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('👑 Admin: username=admin, password=admin123');
    console.log('👔 Executive: username=executive, password=exec123');
    console.log('🎭 Demo: username=demo, password=demo123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    process.exit(0);
  }
}

seedUsers();
