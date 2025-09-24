const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, required: true, enum: ['admin', 'executive', 'customer-executive'] },
  isApproved: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  lastLoginAt: { type: Date }
});

const User = mongoose.model('User', userSchema);

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://Admin:Admin123@cluster0.8xqjq.mongodb.net/test?retryWrites=true&w=majority');
    console.log('✅ Connected to MongoDB');
    
    const users = await User.find({});
    console.log('📊 Found users:');
    users.forEach(user => {
      console.log(`- ${user.username} (${user.role}) - ${user.name} - Active: ${user.isActive} - Approved: ${user.isApproved}`);
    });
    
    // Create Sanjana user if not exists
    const sanjana = await User.findOne({ username: 'sanjana' });
    if (!sanjana) {
      const hashedPassword = await bcrypt.hash('sanjana123', 10);
      const newUser = new User({
        username: 'sanjana',
        email: 'sanjana@envirocare.com',
        password: hashedPassword,
        name: 'Sanjana Pawar',
        role: 'executive',
        isApproved: true,
        isActive: true
      });
      await newUser.save();
      console.log('✅ Created Sanjana user');
    } else {
      console.log('✅ Sanjana user already exists');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

checkUsers();
