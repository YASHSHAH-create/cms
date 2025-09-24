const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// User schema (simplified version)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, enum: ['admin', 'executive', 'customer-executive'], default: 'executive' },
  isApproved: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date }
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb+srv://Admin:Admin123@ems-cluster.mdwsv3q.mongodb.net/?retryWrites=true&w=majority&appName=ems-cluster';
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ username: 'admin@envirocarelabs.com' });
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      console.log('Username:', existingAdmin.username);
      console.log('Name:', existingAdmin.name);
      console.log('Role:', existingAdmin.role);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user
    const adminUser = new User({
      username: 'admin@envirocarelabs.com',
      password: hashedPassword,
      name: 'System Administrator',
      email: 'admin@envirocarelabs.com',
      role: 'admin',
      isApproved: true,
      isActive: true
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully');
    console.log('Username: admin@envirocarelabs.com');
    console.log('Password: admin123');
    console.log('Name: System Administrator');
    console.log('Role: admin');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

createAdmin();
